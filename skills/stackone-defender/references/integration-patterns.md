# Defender Integration Patterns

Common patterns for integrating StackOne Defender into agent and application pipelines.

## Pattern 1: Agent tool-result scanning

Scan all tool outputs before they enter the LLM context window. This is the most critical integration point — external APIs are the primary vector for indirect prompt injection.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ tier2: { mode: "onnx" } });

async function safeToolCall(toolName: string, args: any): Promise<string> {
  const rawResult = await executeTool(toolName, args);
  const text = JSON.stringify(rawResult);

  const scan = await defense.scan(text);
  if (!scan.allowed) {
    return `[BLOCKED] Tool "${toolName}" returned suspicious content (score: ${scan.score.toFixed(2)}, tier: ${scan.tier})`;
  }
  return text;
}
```

## Pattern 2: User input validation

Scan user messages before processing. Catches direct prompt injection attempts.

```typescript
async function handleUserMessage(message: string) {
  const scan = await defense.scan(message);

  if (!scan.allowed) {
    return { error: "Input blocked by security policy", score: scan.score };
  }

  // Proceed with normal processing
  return await processMessage(message);
}
```

## Pattern 3: Express/Fastify middleware

Add Defender as HTTP middleware to protect API endpoints that accept free-text input.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ tier2: { mode: "onnx" } });

// Express middleware
async function defenderMiddleware(req, res, next) {
  const text = req.body?.message || req.body?.input || req.body?.prompt;
  if (!text) return next();

  const scan = await defense.scan(text);
  if (!scan.allowed) {
    return res.status(400).json({
      error: "Input rejected",
      reason: `Detected by ${scan.tier} (score: ${scan.score.toFixed(2)})`,
    });
  }
  next();
}

app.post("/api/chat", defenderMiddleware, chatHandler);
```

## Pattern 4: Batch evaluation

Evaluate Defender against a labeled dataset to measure detection quality.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ tier2: { mode: "onnx" } });

interface Sample {
  text: string;
  label: "malicious" | "benign";
}

async function evaluate(samples: Sample[], threshold = 0.5) {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const { text, label } of samples) {
    const result = await defense.scan(text);
    const predicted = !result.allowed;
    const actual = label === "malicious";

    if (predicted && actual) tp++;
    else if (predicted && !actual) fp++;
    else if (!predicted && !actual) tn++;
    else fn++;
  }

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;
  const fpr = fp / (fp + tn) || 0;

  return { tp, fp, tn, fn, precision, recall, f1, fpr };
}
```

## Pattern 5: Pre-warming for low-latency applications

The ONNX model loads on first inference. Pre-warm at startup to avoid cold-start latency.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ tier2: { mode: "onnx" } });

// Pre-warm at application startup
await defense.scan("warmup");
console.log("Defender ready");

// All subsequent scans will be fast (5-15ms typical)
```

## When to use which pattern

| Scenario | Pattern | Priority |
|----------|---------|----------|
| Agent with tool use | Tool-result scanning | **Critical** — primary injection vector |
| Chatbot / user-facing | User input validation | High — catches direct attacks |
| API endpoint | Express middleware | High — protects at the boundary |
| Security testing | Batch evaluation | For tuning and benchmarking |
| Production service | Pre-warming | Recommended for latency-sensitive apps |
