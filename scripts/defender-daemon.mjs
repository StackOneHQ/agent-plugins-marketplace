#!/usr/bin/env node

/**
 * Defender daemon — long-running scanner over a Unix domain socket.
 *
 * Spawned on demand by scan-tool-result.mjs. Holds one warm PromptDefense
 * instance so per-hook scans cost ~5–15ms instead of cold-loading ONNX
 * (~500ms) every invocation. Also avoids the libc++abi mutex teardown
 * noise that onnxruntime-node emits on every fresh Node exit — the
 * cleanup race fires once per daemon lifetime, in a background process,
 * not on user-visible tool calls.
 *
 * Wire protocol (line-delimited JSON over UDS):
 *   server → client (on connect):
 *     { type: "hello", defenderVersion, protocolVersion, pid }
 *   client → server:
 *     { type: "scan", id, payload, toolName }
 *   server → client:
 *     { type: "result", id, result }   // result = DefenseResult
 *     { type: "error",  id, error }
 *
 * Lifecycle: idle-exits after IDLE_TIMEOUT_MS without a scan request.
 * SIGTERM/SIGINT: drain in-flight scans, unlink socket, exit 0.
 */

import { createRequire } from "module";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { createServer } from "net";
import { unlinkSync, existsSync, readFileSync, appendFileSync, writeFileSync, mkdirSync, statSync, renameSync } from "fs";

const PROTOCOL_VERSION = 1;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min
const UPTIME_CAP_MS = 12 * 60 * 60 * 1000; // 12 hours — graceful self-restart bound
const LOG_SIZE_CAP_BYTES = 5 * 1024 * 1024; // 5 MB before rotation
const SOCKET_PATH = join(homedir(), ".claude", "defender.sock");
const DAEMON_LOG = join(homedir(), ".claude", "defender-daemon.log");
const DAEMON_STATE = join(homedir(), ".claude", "defender-daemon.json");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDir, "..");
const configPath = join(scriptDir, "defender-daemon.config.json");
const requireFrom = createRequire(join(pluginRoot, "package.json"));

function rotateLogIfNeeded() {
  try {
    const size = statSync(DAEMON_LOG).size;
    if (size < LOG_SIZE_CAP_BYTES) return;
    // Rotate: current log → .1 (overwrites any previous .1). Single-tier
    // rotation; we don't keep deeper history because the log is for
    // recent-failure debugging, not long-term audit.
    renameSync(DAEMON_LOG, `${DAEMON_LOG}.1`);
  } catch {
    // Log missing or rename failed — both safe to ignore.
  }
}

function log(msg, extra) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    pid: process.pid,
    msg,
    ...(extra ?? {}),
  });
  try {
    appendFileSync(DAEMON_LOG, line + "\n");
  } catch {
    // Best-effort logging only.
  }
}

function fatal(msg, err) {
  log(msg, { error: err instanceof Error ? err.message : String(err) });
  process.stderr.write(`[defender-daemon] ${msg}: ${err}\n`);
  process.exit(1);
}

// --- Status mode ---------------------------------------------------------
// `node defender-daemon.mjs --status` prints a brief health report and
// exits. Useful for debugging without grepping the log.
if (process.argv[2] === "--status") {
  const lines = [];
  let state = null;
  try {
    state = JSON.parse(readFileSync(DAEMON_STATE, "utf8"));
  } catch {
    // ignore — no daemon running
  }
  if (!state) {
    lines.push("daemon: not running (no state file)");
  } else {
    let alive = false;
    try {
      process.kill(state.pid, 0);
      alive = true;
    } catch (err) {
      alive = err.code === "EPERM";
    }
    lines.push(`daemon: ${alive ? "running" : "STALE (pid not alive)"}`);
    lines.push(`  pid:              ${state.pid}`);
    lines.push(`  defenderVersion:  ${state.defenderVersion}`);
    lines.push(`  protocolVersion:  ${state.protocolVersion}`);
    lines.push(`  startedAt:        ${state.startedAt}`);
    lines.push(`  socket:           ${state.socket}`);
    lines.push(`  socket exists:    ${existsSync(state.socket)}`);
  }
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
}

// Ensure ~/.claude exists (it almost always does, but cheap to guarantee).
try {
  mkdirSync(dirname(SOCKET_PATH), { recursive: true });
} catch (err) {
  fatal("failed to create state dir", err);
}

// Rotate log at startup if it's already over the cap. Cheap one-time check.
rotateLogIfNeeded();

// Load PromptDefense from the plugin's own node_modules.
let PromptDefense;
let defenderRoot;
let defenderVersion = "unknown";
try {
  PromptDefense = requireFrom("@stackone/defender").PromptDefense;
  defenderRoot = dirname(requireFrom.resolve("@stackone/defender"));
  try {
    const pkg = JSON.parse(readFileSync(join(defenderRoot, "..", "package.json"), "utf8"));
    defenderVersion = pkg.version ?? "unknown";
  } catch {
    // version is informational only
  }
} catch (err) {
  fatal("failed to load @stackone/defender", err);
}

// Load daemon config. The config file is sibling-to this script so each
// install (marketplace source vs installed plugin cache) ships its own
// constructor args without forking the daemon code.
let rawConfig = {};
try {
  rawConfig = JSON.parse(readFileSync(configPath, "utf8"));
} catch (err) {
  log("no daemon config found, using defaults", { configPath, error: String(err) });
}

// Resolve `${defenderRoot}` placeholders in config (used for onnxModelPath).
function resolvePlaceholders(value) {
  if (typeof value === "string") {
    return value.replace("${defenderRoot}", defenderRoot);
  }
  if (Array.isArray(value)) return value.map(resolvePlaceholders);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolvePlaceholders(v)]));
  }
  return value;
}

const defenseOptions = resolvePlaceholders(rawConfig);
log("starting daemon", { defenderVersion, defenseOptions });

const defense = new PromptDefense(defenseOptions);
try {
  await defense.warmupTier2();
} catch (err) {
  fatal("warmupTier2 failed", err);
}
log("warmup complete");

// Idle-exit + uptime-cap tracking. Reset `lastActivity` on every scan
// request; uptime cap is a hard upper bound to mitigate slow leaks in
// long-running daemons (next scan will respawn a fresh one).
const startedAtMs = Date.now();
let lastActivity = Date.now();
let inFlight = 0;

function maybeExit() {
  if (inFlight !== 0) return;
  if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
    log("idle timeout reached, shutting down");
    shutdown(0);
    return;
  }
  if (Date.now() - startedAtMs >= UPTIME_CAP_MS) {
    log("uptime cap reached, shutting down");
    shutdown(0);
    return;
  }
  rotateLogIfNeeded();
}
const idleInterval = setInterval(maybeExit, 60_000).unref();

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(idleInterval);
  try {
    server.close();
  } catch {
    // ignore — caller is exiting anyway
  }
  try {
    if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH);
  } catch {
    // ignore — caller is exiting anyway
  }
  try {
    if (existsSync(DAEMON_STATE)) unlinkSync(DAEMON_STATE);
  } catch {
    // ignore — caller is exiting anyway
  }
  // Give in-flight responses a moment to drain to the socket buffer.
  setTimeout(() => process.exit(code), 50);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (err) => {
  log("uncaught exception", { error: err.message, stack: err.stack });
  shutdown(1);
});

// Remove stale socket if a prior daemon crashed without cleaning up.
// We hold the spawn lock externally (client takes flock before spawning),
// so this can't race with another live daemon.
try {
  if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH);
} catch (err) {
  fatal("failed to remove stale socket", err);
}

const server = createServer((socket) => {
  // Per-connection state. Each client connection sends one scan and then
  // closes; we still handle multi-request connections cleanly via line
  // splitting.
  let buf = "";
  const hello = {
    type: "hello",
    defenderVersion,
    protocolVersion: PROTOCOL_VERSION,
    pid: process.pid,
  };
  socket.write(JSON.stringify(hello) + "\n");

  socket.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (!line.trim()) continue;
      handleLine(line, socket).catch((err) => {
        log("handleLine error", { error: err.message });
      });
    }
  });
  socket.on("error", (err) => log("socket error", { error: err.message }));
});

async function handleLine(line, socket) {
  let req;
  try {
    req = JSON.parse(line);
  } catch (err) {
    socket.write(JSON.stringify({ type: "error", id: null, error: `bad json: ${err.message}` }) + "\n");
    return;
  }
  if (req.type !== "scan") {
    socket.write(JSON.stringify({ type: "error", id: req.id ?? null, error: `unknown type: ${req.type}` }) + "\n");
    return;
  }
  lastActivity = Date.now();
  inFlight++;
  try {
    const result = await defense.defendToolResult(req.payload, req.toolName ?? "tool-result");
    socket.write(JSON.stringify({ type: "result", id: req.id, result }) + "\n");
  } catch (err) {
    log("scan error", { error: err.message });
    socket.write(JSON.stringify({ type: "error", id: req.id, error: err.message }) + "\n");
  } finally {
    inFlight--;
    lastActivity = Date.now();
  }
}

server.listen(SOCKET_PATH, () => {
  log("listening", { socket: SOCKET_PATH });
  // Best-effort state file for `defender-daemon status` and version-mismatch
  // detection by the client. Removed on graceful shutdown.
  try {
    const state = {
      pid: process.pid,
      defenderVersion,
      protocolVersion: PROTOCOL_VERSION,
      startedAt: new Date().toISOString(),
      socket: SOCKET_PATH,
    };
    writeFileSync(DAEMON_STATE, JSON.stringify(state, null, 2));
  } catch (err) {
    log("failed to write state file", { error: err.message });
  }
});
server.on("error", (err) => fatal("server error", err));
