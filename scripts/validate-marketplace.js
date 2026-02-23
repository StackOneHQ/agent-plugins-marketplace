#!/usr/bin/env node
/**
 * Validates .claude-plugin/marketplace.json against the exact Zod schema
 * used by Claude Code internally (reverse-engineered from cli.js).
 */

import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

// ─── Schemas (mirroring Claude Code's internal Zod definitions) ──────────────

// yQ: local path must start with "./"
const localPath = z.string().startsWith("./");

// l97: full 40-char git commit SHA
const gitSha = z
  .string()
  .length(40)
  .regex(/^[a-f0-9]{40}$/, "Must be a full 40-character lowercase git commit SHA");

// jP5: plugin source union
const pluginSource = z.union([
  localPath.describe("Path to the plugin root, relative to the marketplace directory"),
  z
    .object({
      source: z.literal("npm"),
      package: z.string().describe("Package name"),
      version: z.string().optional().describe("Version or version range (e.g., ^1.0.0)"),
      registry: z.string().url().optional().describe("Custom NPM registry URL"),
    })
    .describe("NPM package as plugin source"),
  z
    .object({
      source: z.literal("pip"),
      package: z.string().describe("Python package name on PyPI"),
      version: z.string().optional().describe("Version specifier (e.g., ==1.0.0)"),
      registry: z.string().url().optional().describe("Custom PyPI registry URL"),
    })
    .describe("Python package as plugin source"),
  z
    .object({
      source: z.literal("url"),
      url: z.string().endsWith(".git").describe("Full git repository URL (https:// or git@)"),
      ref: z.string().optional().describe('Git branch or tag (e.g., "main", "v1.0.0")'),
      sha: gitSha.optional().describe("Specific commit SHA"),
    })
    .describe("Git URL as plugin source"),
  z
    .object({
      source: z.literal("github"),
      repo: z.string().describe("GitHub repository in owner/repo format"),
      ref: z.string().optional().describe('Git branch or tag (e.g., "main", "v1.0.0")'),
      sha: gitSha.optional().describe("Specific commit SHA"),
    })
    .describe("GitHub repository as plugin source"),
]);

// n97: owner/author
const owner = z.object({
  name: z.string().min(1, "Author name cannot be empty"),
  email: z.string().optional(),
  url: z.string().optional(),
});

// DP5: marketplace plugin entry
const marketplacePlugin = z
  .object({
    name: z
      .string()
      .min(1, "Plugin name cannot be empty")
      .refine((n) => !n.includes(" "), {
        message: 'Plugin name cannot contain spaces. Use kebab-case (e.g., "my-plugin")',
      }),
    source: pluginSource,
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    version: z.string().optional(),
    author: owner.optional(),
    homepage: z.string().optional(),
    repository: z.string().optional(),
    license: z.string().optional(),
    strict: z.boolean().optional().default(true),
  })
  .strict();

// e76: marketplace schema
const marketplaceSchema = z.object({
  $schema: z.string().optional(),
  name: z
    .string()
    .min(1, "Marketplace must have a name")
    .refine((n) => !n.includes(" "), {
      message: 'Marketplace name cannot contain spaces. Use kebab-case (e.g., "my-marketplace")',
    }),
  owner: owner.optional(),
  plugins: z.array(marketplacePlugin).min(1, "Marketplace must have at least one plugin"),
  forceRemoveDeletedPlugins: z.boolean().optional(),
  metadata: z
    .object({
      pluginRoot: z.string().optional(),
      version: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

// ─── Validate ─────────────────────────────────────────────────────────────────

const filePath = resolve(ROOT, ".claude-plugin/marketplace.json");

if (!existsSync(filePath)) {
  console.error("❌  .claude-plugin/marketplace.json not found");
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(readFileSync(filePath, "utf8"));
} catch (e) {
  console.error(`❌  .claude-plugin/marketplace.json: invalid JSON — ${e.message}`);
  process.exit(1);
}

const result = marketplaceSchema.safeParse(raw);

if (!result.success) {
  const issues = result.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`❌  .claude-plugin/marketplace.json validation failed:\n${issues}`);
  process.exit(1);
}

console.log(
  `✅  .claude-plugin/marketplace.json — valid (${result.data.plugins.length} plugin(s))`
);
