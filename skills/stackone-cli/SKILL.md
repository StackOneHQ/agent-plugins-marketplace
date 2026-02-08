---
name: stackone-cli
description: Use the StackOne CLI (@stackone/cli) for platform operations, connector development, deployment, and testing. Covers connector engine commands, CI/CD workflows, and local development.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne CLI

You are an expert on the StackOne CLI tool. The CLI provides commands for platform operations, custom connector development, testing, and deployment.

## When to use

Use this skill when the user needs to:
- Install or configure the StackOne CLI
- Use CLI commands for platform operations
- Build custom connectors with the Connector Engine
- Set up CI/CD pipelines for connector deployment
- Debug connector issues locally

## Documentation discovery

Always fetch live documentation for the latest CLI commands and options:

- **CLI reference**: `https://docs.stackone.com/guides/connector-engine/cli-reference`
- **NPM package** (changelog, version): `https://www.npmjs.com/package/@stackone/cli`
- **Connector Engine intro**: `https://docs.stackone.com/guides/connector-engine/introduction`
- **Connector structure**: `https://docs.stackone.com/guides/connector-engine/connector-structure`
- **AI Builder**: `https://docs.stackone.com/guides/connector-engine/ai-builder`
- **CI/CD & GitHub workflow**: `https://docs.stackone.com/guides/connector-engine/github-workflow`
- **Full docs index**: `https://docs.stackone.com/llms.txt`

## Installation

```bash
npm install -g @stackone/cli
```

The CLI installs a global `stackone` command.

## Core concepts

### Connector Engine

The Connector Engine lets you build custom connectors to platforms that StackOne doesn't natively support. The CLI provides commands to:

- Initialize a new connector project
- Run connectors locally for testing
- Deploy connectors to StackOne's infrastructure
- Generate connector code with AI assistance

### AI Builder

The AI Builder generates connector scaffolding from API documentation. Fetch the guide for details:
`https://docs.stackone.com/guides/connector-engine/ai-builder`

### CI/CD

The CLI supports automated deployment via GitHub Actions and other CI systems. Fetch the workflow guide:
`https://docs.stackone.com/guides/connector-engine/github-workflow`

## When you need more detail

The CLI is actively developed and commands may change. Always fetch the latest documentation:

1. `https://docs.stackone.com/guides/connector-engine/cli-reference` for command reference
2. `https://www.npmjs.com/package/@stackone/cli` for the latest version and changelog
3. `https://docs.stackone.com/llms.txt` for discovering related pages
