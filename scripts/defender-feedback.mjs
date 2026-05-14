#!/usr/bin/env node

/**
 * Defender feedback CLI — record a Claude-confirmed false positive.
 *
 * Invoked by Claude (the assistant) after the user approves a "this was a
 * false positive" label. Appends one JSON line to a local jsonl AND POSTs
 * the same record to the Modal collector if `~/.claude/defender-collector.json`
 * is configured.
 *
 * Only false positives flow through this path — the regular scan hook no
 * longer auto-posts flagged content to the collector. Higher signal per
 * record, lower volume; intended for FP-rate tracking and active
 * relabeling, not bulk telemetry.
 *
 * Usage:
 *   defender-feedback.mjs \
 *     --label false_positive \
 *     --score 0.951 \
 *     --reason "skill file describing injection patterns; meta-discussion not an attack" \
 *     --payload-file /tmp/payload.json \
 *     [--risk high] [--tool-name Read] [--detections ignore_previous,shell_command]
 *
 * Exit codes:
 *   0 = recorded (local write succeeded; collector POST is best-effort)
 *   1 = bad args / payload-file unreadable
 */

import { dirname, join, isAbsolute, resolve } from "path";
import { homedir } from "os";
import { readFileSync, appendFileSync } from "fs";
import { spawn } from "child_process";

const LOG_PATH = join(homedir(), ".claude", "defender-feedback.jsonl");
const COLLECTOR_CONFIG_PATH = join(homedir(), ".claude", "defender-collector.json");

function die(msg) {
  process.stderr.write(`[defender-feedback] ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) die(`flag ${a} requires a value`);
      out[key] = val;
      i++;
    } else {
      die(`unexpected positional arg: ${a}`);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (!args.label) die("--label required (e.g. false_positive)");
if (!args.reason) die("--reason required");
if (!args["payload-file"]) die("--payload-file required");

let payload;
try {
  const path = isAbsolute(args["payload-file"])
    ? args["payload-file"]
    : resolve(process.cwd(), args["payload-file"]);
  payload = JSON.parse(readFileSync(path, "utf8"));
} catch (err) {
  die(`failed to read --payload-file: ${err.message}`);
}

const record = {
  timestamp: new Date().toISOString(),
  event: "feedback",
  source: "claude-flagged",
  label: args.label,
  reason: args.reason,
  riskLevel: args.risk ?? null,
  tier2Score: args.score !== undefined ? Number(args.score) : null,
  detections: args.detections ? args.detections.split(",") : [],
  tool_name: args["tool-name"] ?? null,
  payload,
};

try {
  appendFileSync(LOG_PATH, JSON.stringify(record) + "\n");
} catch (err) {
  die(`local write failed: ${err.message}`);
}

// Best-effort collector POST. Detached so the local write counts as the
// authoritative record even if the network is gone.
let collectorConfig = null;
try {
  collectorConfig = JSON.parse(readFileSync(COLLECTOR_CONFIG_PATH, "utf8"));
} catch {
  // No collector configured — local-only is the supported degraded mode.
}

if (collectorConfig?.url && collectorConfig?.api_key) {
  const body = JSON.stringify({ api_key: collectorConfig.api_key, entries: [record] });
  try {
    const child = spawn(
      "curl",
      [
        "-s", "-o", "/dev/null", "--max-time", "10",
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", body,
        collectorConfig.url,
      ],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
  } catch (err) {
    process.stderr.write(`[defender-feedback] collector POST spawn failed: ${err.message}\n`);
  }
}

process.stdout.write(
  `recorded false-positive feedback locally (${LOG_PATH})` +
  (collectorConfig ? " and dispatched to collector\n" : "; no collector configured\n"),
);
