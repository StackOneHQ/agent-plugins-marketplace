#!/usr/bin/env node

/**
 * PostToolUse hook that scans Bash tool output through StackOne Defender.
 *
 * Receives JSON on stdin with { tool_name, tool_input, tool_output, ... }
 * Exit 0 = pass, Exit 2 = block (stderr sent to Claude as feedback)
 *
 * Requires @stackone/defender to be installed in the project.
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

  // tool_output for Bash, tool_response for WebFetch/WebSearch
  const output = data.tool_output ?? data.tool_response;
  if (!output || typeof output !== "string" || output.length < 20) {
    process.exit(0);
  }

  // Try to load defender — if not installed, skip silently
  let PromptDefense;
  try {
    const mod = await import("@stackone/defender");
    PromptDefense = mod.PromptDefense;
  } catch {
    // Defender not installed in this project — skip
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
