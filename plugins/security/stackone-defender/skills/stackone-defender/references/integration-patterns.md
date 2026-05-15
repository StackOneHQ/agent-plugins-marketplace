# Defender Integration Patterns

Common patterns for integrating StackOne Defender into agent and application pipelines.

## Pattern 1: Agent tool-result scanning (primary use case)

Scan all tool outputs before they enter the LLM context window. This is the most critical integration point — external APIs are the primary vector for indirect prompt injection.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ blockHighRisk: true });
await defense.warmupTier2();

async function safeToolCall(toolName: string, args: any): Promise<unknown> {
  const rawResult = await executeTool(toolName, args);

  const result = await defense.defendToolResult(rawResult, toolName);

  if (!result.allowed) {
    console.warn(`[BLOCKED] Tool "${toolName}": risk=${result.riskLevel}, tier2Score=${result.tier2Score}, detections=${result.detections}`);
    return { error: "Tool result blocked by security policy" };
  }

  // Use sanitized output — Tier 1 patterns have been stripped
  return result.sanitized;
}
```

## Pattern 2: Quick text analysis (Tier 1 only)

Use `analyze()` for fast pattern-only checks on raw text. No ML overhead.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense();

function quickCheck(text: string) {
  const result = defense.analyze(text);

  if (result.hasDetections) {
    console.warn(`Patterns found: ${result.matches.map(m => m.pattern).join(", ")}`);
    console.warn(`Suggested risk: ${result.suggestedRisk}`);
  }

  return result;
}
```

## Pattern 3: Express/Fastify middleware

Add Defender as HTTP middleware to protect API endpoints that accept free-text input.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ blockHighRisk: true });
await defense.warmupTier2();

async function defenderMiddleware(req, res, next) {
  try {
    const text = req.body?.message || req.body?.input || req.body?.prompt;
    if (!text) return next();

    const result = await defense.defendToolResult({ input: text }, "api_input");

    if (!result.allowed) {
      return res.status(400).json({
        error: "Input rejected",
        riskLevel: result.riskLevel,
        tier2Score: result.tier2Score,
      });
    }

    // Attach sanitized input for downstream handlers
    req.sanitizedInput = result.sanitized;
    next();
  } catch (err) {
    next(err);
  }
}

app.post("/api/chat", defenderMiddleware, chatHandler);
```

## Pattern 4: Batch evaluation

Evaluate Defender against a labeled dataset to measure detection quality.

```typescript
import { PromptDefense } from "@stackone/defender";

const defense = new PromptDefense({ blockHighRisk: true });
await defense.warmupTier2();

interface Sample {
  text: string;
  label: "malicious" | "benign";
}

async function evaluate(samples: Sample[]) {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const { text, label } of samples) {
    const result = await defense.defendToolResult({ input: text }, "eval");
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

const defense = new PromptDefense({ blockHighRisk: true });

// Pre-warm at application startup
await defense.warmupTier2();
console.log("Tier 2 ready:", defense.isTier2Ready());

// All subsequent calls will be fast (5-15ms typical)
```

## When to use which pattern

| Scenario | Pattern | Method | Priority |
|----------|---------|--------|----------|
| Agent with tool use | Tool-result scanning | `defendToolResult()` | **Critical** — primary injection vector |
| Quick text check | Text analysis | `analyze()` | Medium — Tier 1 only, fast |
| API endpoint | Express middleware | `defendToolResult()` | High — protects at the boundary |
| Security testing | Batch evaluation | `defendToolResult()` | For tuning and benchmarking |
| Production service | Pre-warming | `warmupTier2()` | Recommended for latency-sensitive apps |
