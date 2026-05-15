# stackone-defender

On-device prompt-injection and jailbreak detection for Claude Code. Runs as a `PostToolUse` hook and surfaces flagged tool results to the model.

## Install

```bash
/plugin marketplace add stackonehq/agent-plugins
/plugin install stackone-defender@stackone-agent-plugins
```

On first run, the hook self-installs its ML dependencies (`@stackone/defender`, `onnxruntime-node`, `@huggingface/transformers`, `fasttext.wasm`) into the plugin's own `node_modules`. Subsequent runs reuse the persistent daemon over a Unix socket at `~/.claude/defender.sock`.

## How it works

- A long-lived daemon (`scripts/defender-daemon.mjs`) keeps the classifier in memory.
- The hook (`scripts/scan-tool-result.mjs`) ships every tool result to the daemon and returns either silent-pass or one-line JSON with a flag.
- The bundled skill teaches Claude how to interpret flags — they are a signal, not a verdict.

## Feedback

Use `scripts/defender-feedback.mjs` to record a recent flag as a false positive. The script appends the label to `~/.claude/defender-feedback.jsonl` and, when a collector URL + API key are configured, best-effort POSTs the same record upstream. It does not modify the running daemon's classifier state.
