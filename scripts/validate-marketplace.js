#!/usr/bin/env node
/**
 * Validates .claude-plugin/marketplace.json and .claude-plugin/plugin.json
 * against the Claude Code plugin schema.
 *
 * Schema rules derived from the Claude Code plugin system:
 * - marketplace.json: validates the marketplace definition and all plugin entries
 * - plugin.json: validates the root plugin definition
 *
 * Source field for marketplace plugin entries must be one of:
 *   - A relative path string starting with "./" (e.g. "./plugins/my-plugin")
 *   - A GitHub object: { source: "github", repo: "owner/name", path?: "..." }
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

let exitCode = 0;

function error(file, msg) {
  console.error(`❌  ${file}: ${msg}`);
  exitCode = 1;
}

function ok(file, msg) {
  console.log(`✅  ${file}: ${msg}`);
}

// ─── Source validation ────────────────────────────────────────────────────────

function validateSource(source, pluginName, file) {
  if (typeof source === "string") {
    if (!source.startsWith("./")) {
      error(
        file,
        `plugins["${pluginName}"].source: string source must start with "./" (got "${source}"). ` +
          `Bare "." or absolute paths are not valid.`
      );
      return false;
    }
    return true;
  }

  if (typeof source === "object" && source !== null) {
    if (source.source !== "github") {
      error(
        file,
        `plugins["${pluginName}"].source.source: object source must have source="github" (got "${source.source}")`
      );
      return false;
    }
    if (typeof source.repo !== "string" || !source.repo.includes("/")) {
      error(
        file,
        `plugins["${pluginName}"].source.repo: must be a string in "owner/repo" format (got ${JSON.stringify(source.repo)})`
      );
      return false;
    }
    if (source.path !== undefined && typeof source.path !== "string") {
      error(
        file,
        `plugins["${pluginName}"].source.path: must be a string if provided (got ${JSON.stringify(source.path)})`
      );
      return false;
    }
    return true;
  }

  error(
    file,
    `plugins["${pluginName}"].source: Invalid input — must be a "./relative" string or a ` +
      `{ source: "github", repo: "owner/name" } object (got ${JSON.stringify(source)})`
  );
  return false;
}

// ─── marketplace.json ─────────────────────────────────────────────────────────

function validateMarketplace(filePath) {
  const rel = filePath.replace(ROOT, "");

  if (!existsSync(filePath)) {
    error(rel, "file not found");
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    error(rel, `invalid JSON — ${e.message}`);
    return;
  }

  if (typeof data.name !== "string" || !data.name) {
    error(rel, "name: must be a non-empty string");
  }

  if (!Array.isArray(data.plugins)) {
    error(rel, "plugins: must be an array");
    return;
  }

  if (data.plugins.length === 0) {
    error(rel, "plugins: array must not be empty");
    return;
  }

  let allValid = true;
  for (const [i, plugin] of data.plugins.entries()) {
    const label = plugin.name ?? `[${i}]`;

    if (typeof plugin.name !== "string" || !plugin.name) {
      error(rel, `plugins[${i}].name: must be a non-empty string`);
      allValid = false;
    }

    if (plugin.source === undefined) {
      error(rel, `plugins["${label}"].source: field is required`);
      allValid = false;
    } else {
      if (!validateSource(plugin.source, label, rel)) allValid = false;
    }

    if (typeof plugin.description !== "string" || !plugin.description) {
      error(rel, `plugins["${label}"].description: must be a non-empty string`);
      allValid = false;
    }

    if (plugin.tags !== undefined) {
      if (!Array.isArray(plugin.tags) || !plugin.tags.every((t) => typeof t === "string")) {
        error(rel, `plugins["${label}"].tags: must be an array of strings`);
        allValid = false;
      }
    }
  }

  if (allValid) {
    ok(rel, `${data.plugins.length} plugin(s) — all valid`);
  }
}

// ─── plugin.json ─────────────────────────────────────────────────────────────

function validatePlugin(filePath) {
  const rel = filePath.replace(ROOT, "");

  if (!existsSync(filePath)) {
    // plugin.json is optional for marketplaces that don't expose a root plugin
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    error(rel, `invalid JSON — ${e.message}`);
    return;
  }

  if (typeof data.name !== "string" || !data.name) {
    error(rel, "name: must be a non-empty string");
  } else if (typeof data.description !== "string" || !data.description) {
    error(rel, "description: must be a non-empty string");
  } else {
    ok(rel, `plugin "${data.name}" v${data.version ?? "unversioned"} — valid`);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

validateMarketplace(resolve(ROOT, ".claude-plugin/marketplace.json"));
validatePlugin(resolve(ROOT, ".claude-plugin/plugin.json"));

if (exitCode === 0) {
  console.log("\n✓ All plugin files are valid.");
} else {
  console.error("\n✗ Validation failed — see errors above.");
}

process.exit(exitCode);
