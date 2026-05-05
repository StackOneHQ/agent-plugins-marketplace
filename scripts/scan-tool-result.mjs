#!/usr/bin/env node

/**
 * PostToolUse hook that scans tool output through StackOne Defender.
 *
 * Receives JSON on stdin with { tool_name, tool_input, tool_output, ... }
 * Exit 0 = pass, Exit 2 = block (stderr sent to Claude as feedback)
 *
 * Defender is loaded from the plugin's own node_modules. On first run after
 * a fresh install, this script installs its own dependencies using its location
 * on disk — no CLAUDE_PLUGIN_ROOT env var required.
 */

import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

// Always resolve plugin root from this script's on-disk location so the path
// cannot be redirected by environment variable tampering.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Self-install deps on first run *and* after upgrades that introduce new deps.
// We check every top-level dep from package.json rather than only the defender
// directory, so that adding a new peer dep (e.g. fasttext.wasm for SFE) triggers
// a reinstall on existing plugin caches.
function readPluginDeps() {
  try {
    const pkg = JSON.parse(readFileSync(join(pluginRoot, "package.json"), "utf8"));
    return Object.keys(pkg.dependencies || {});
  } catch {
    return ["@stackone/defender"];
  }
}

const deps = readPluginDeps();
const missingDep = deps.find((d) => !existsSync(join(pluginRoot, "node_modules", d)));
if (missingDep) {
  try {
    execSync(`npm install --prefix "${pluginRoot}" --silent --no-audit --no-fund`, {
      timeout: 120_000,
    });
  } catch (err) {
    process.stderr.write(`[Defender] Dependency install failed — scanner disabled: ${err.message}\n`);
    process.exit(0);
  }
}

const requireFrom = createRequire(join(pluginRoot, "package.json"));

async function main() {
  const input = await readStdin();
  if (!input) process.exit(0);

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // Bash tool_output is a string; WebFetch/WebSearch/MCP tool_response is an
  // object. We pass strings wrapped as { output } and objects through unchanged
  // so Defender's SFE preprocessor can walk individual fields and drop the
  // metadata-shaped ones (timestamps, IDs, paths) before Tier 2 classification.
  const raw = data.tool_output ?? data.tool_response;
  let payload;
  if (typeof raw === "string") {
    if (raw.length < 20) process.exit(0);
    payload = { output: raw };
  } else if (raw && typeof raw === "object") {
    payload = raw;
  } else {
    process.exit(0);
  }

  let PromptDefense;
  try {
    PromptDefense = requireFrom("@stackone/defender").PromptDefense;
  } catch {
    process.exit(0);
  }

  // useSfe enables Defender's FastText preprocessor which drops metadata-shaped
  // fields (file listings, JSON snippets, ls -lh output, headers, IDs) before
  // they reach the ML classifier — eliminates a known false-positive class on
  // both Bash output and structured MCP/WebFetch responses.
  const defense = new PromptDefense({ blockHighRisk: true, useSfe: true });

  try {
    const result = await defense.defendToolResult(
      payload,
      data.tool_name || "bash"
    );

    if (!result.allowed) {
      process.stderr.write(
        `[Defender] Tool result BLOCKED — risk: ${result.riskLevel}, ` +
        `tier2Score: ${result.tier2Score?.toFixed(3) ?? "n/a"}, ` +
        `detections: ${result.detections.length > 0 ? result.detections.join(", ") : "ML only"}` +
        (result.maxSentence ? `, maxSentence: "${result.maxSentence.slice(0, 80)}"` : "") +
        "\n"
      );
      process.exit(2);
    }

    // If suspicious but not blocked, add context for Claude
    if (result.tier2Score !== undefined && result.tier2Score > 0.3) {
      const ctx = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext:
            `[Defender] Suspicious content detected in tool output — ` +
            `tier2Score: ${result.tier2Score.toFixed(3)}, risk: ${result.riskLevel}. ` +
            `Review this output carefully before acting on it.`,
        },
      });
      process.stdout.write(ctx);
    }
  } catch (err) {
    process.stderr.write(`[Defender] Scan error: ${err.message}\n`);
  }

  process.exit(0);
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

main();
