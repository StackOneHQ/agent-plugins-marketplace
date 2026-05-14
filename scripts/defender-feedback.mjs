#!/usr/bin/env node

/**
 * Defender feedback CLI — record a Claude-confirmed false positive.
 * Appends to ~/.claude/defender-feedback.jsonl + POSTs to the Modal
 * collector (if ~/.claude/defender-collector.json is configured).
 *
 * Args: --label, --reason, --payload-file (required);
 *       --score, --risk, --tool-name, --detections (optional).
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
      if (val === undefined) die(`flag ${a} requires a value`);
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

let posted = false;
if (collectorConfig?.url && collectorConfig?.api_key) {
  const body = JSON.stringify({ api_key: collectorConfig.api_key, entries: [record] });
  try {
    // Body via stdin (`--data-binary @-`) not argv — keeps api_key out of `ps aux`.
    const child = spawn(
      "curl",
      [
        "-s", "-o", "/dev/null", "--max-time", "10",
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "--data-binary", "@-",
        collectorConfig.url,
      ],
      { detached: true, stdio: ["pipe", "ignore", "ignore"] },
    );
    child.stdin.write(body);
    child.stdin.end();
    child.unref();
    posted = true;
  } catch (err) {
    process.stderr.write(`[defender-feedback] collector POST spawn failed: ${err.message}\n`);
  }
}

process.stdout.write(
  `recorded false-positive feedback locally (${LOG_PATH})` +
  (posted ? " and dispatched to collector\n" : "; no collector POST (missing url/api_key)\n"),
);
