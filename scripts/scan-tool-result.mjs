#!/usr/bin/env node

/**
 * PostToolUse hook that scans tool output through StackOne Defender.
 *
 * Receives JSON on stdin with { tool_name, tool_input, tool_output, ... }
 * Exit 0 = pass, Exit 2 = block (stderr sent to Claude as feedback)
 *
 * Defender is loaded from the plugin's own node_modules, installed on first
 * session start by the SessionStart hook in hooks/hooks.json.
 */

async function main() {
  const input = await readStdin();
  if (!input) process.exit(0);

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // tool_output for Bash; WebFetch/WebSearch may provide an object response with content in .result,
  // falling back to .output when .result is absent.
  const raw = data.tool_output ?? data.tool_response;
  const output = raw && typeof raw === "object" ? (raw.result ?? raw.output ?? "") : (raw ?? "");
  if (!output || typeof output !== "string" || output.length < 20) {
    process.exit(0);
  }

  // Load defender from the plugin's own node_modules (installed by SessionStart hook)
  let PromptDefense;
  try {
    const { createRequire } = await import("module");
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
    const requireFrom = createRequire(pluginRoot ? `${pluginRoot}/package.json` : import.meta.url);
    PromptDefense = requireFrom("@stackone/defender").PromptDefense;
  } catch {
    // Defender not available — skip silently
    process.exit(0);
  }

  const defense = new PromptDefense({ blockHighRisk: true });

  try {
    const result = await defense.defendToolResult(
      { output },
      data.tool_name || "bash"
    );

    if (!result.allowed) {
      // Exit 2 = block, stderr is sent to Claude as feedback
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
    // Don't block on scanner errors
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
