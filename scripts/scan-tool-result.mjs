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
import { existsSync } from "fs";
import { execSync } from "child_process";

// Always resolve plugin root from this script's on-disk location so the path
// cannot be redirected by environment variable tampering.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Self-install deps on first run — subsequent runs skip this instantly
const defenderDir = join(pluginRoot, "node_modules", "@stackone", "defender");
if (!existsSync(defenderDir)) {
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

  // tool_output for Bash; WebFetch/WebSearch provide an object with content in .result/.output;
  // MCP tools (gmail, etc.) return arbitrary objects — fall back to JSON.stringify so all text
  // fields (body, snippet, headers, …) are included in the scan.
  const raw = data.tool_output ?? data.tool_response;
  let output;
  if (raw && typeof raw === "object") {
    if (typeof raw.result === "string") output = raw.result;
    else if (typeof raw.output === "string") output = raw.output;
    else { try { output = JSON.stringify(raw); } catch (err) { process.stderr.write(`[Defender] Failed to serialize tool response: ${err.message}\n`); output = ""; } }
  } else {
    output = raw ?? "";
  }
  if (!output || typeof output !== "string" || output.length < 20) {
    process.exit(0);
  }

  let PromptDefense;
  try {
    PromptDefense = requireFrom("@stackone/defender").PromptDefense;
  } catch {
    process.exit(0);
  }

  // useSfe enables Defender's FastText preprocessor which drops metadata-shaped
  // fields (file listings, JSON snippets, ls -lh output) before they reach the
  // ML classifier. This eliminates a known false-positive class on Bash output.
  const defense = new PromptDefense({ blockHighRisk: true, useSfe: true });

  try {
    const result = await defense.defendToolResult(
      { output },
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
