---
name: stackone-unified-connectors
description: Build unified/schema-based connectors that transform provider data into standardized schemas. Use when user says "start unified build for [provider]", "build a schema-based connector", "map fields to schema", "test unified connector", or asks about field mapping, enum mapping, pagination configuration, or scope decisions for unified connectors. Covers the complete workflow from schema definition through testing. Do NOT use for agentic/custom connectors that return raw data (use stackone-cli), discovering existing connectors (use stackone-connectors), or building AI agents (use stackone-agents).
license: MIT
compatibility: Requires StackOne CLI (@stackone/cli). Requires access to provider API documentation.
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Unified Connectors

Build connectors that transform provider-specific data into standardized schemas with consistent field names, enum values, and pagination.

## Important

Before building unified connectors:
1. Read the CLI README for current commands: `cat node_modules/@stackone/cli/README.md`
2. Use `stackone help <command>` for command-specific details
3. Always verify response structures with `--debug` before configuring mappings

## Core Principles

These principles apply to ALL unified connector work. Violations cause silent failures or broken mappings.

### 1. All Config Field Names Use camelCase

Every YAML configuration field uses camelCase, not snake_case:

```yaml
# CORRECT
scopeDefinitions:      fieldConfigs:         targetFieldKey:
enumMapper:            matchExpression:      dataKey:
nextKey:               pageSize:             indexField:
stepFunction:          functionName:         dataSource:

# WRONG - causes validation errors or silent failures
scope_definitions:     field_configs:        target_field_key:
```

### 2. Schema Field Names Use YOUR Naming Convention

While config fields are camelCase, `targetFieldKey` values match YOUR schema (often snake_case):

```yaml
fieldConfigs:
  - targetFieldKey: first_name    # YOUR schema field
    expression: $.firstName       # Provider's field
```

### 3. Always Use Version '2' for map_fields and typecast

```yaml
stepFunction:
  functionName: map_fields
  version: '2'          # REQUIRED - omitting causes empty results
```

### 4. Use Inline Fields in map_fields Parameters

Pass `fields` directly in `map_fields` step parameters rather than action-level `fieldConfigs`. This avoids schema inference issues that cause build failures.

```yaml
# RECOMMENDED - Inline fields
- stepId: map_data
  stepFunction:
    functionName: map_fields
    version: '2'
    parameters:
      fields:
        - targetFieldKey: email
          expression: $.email           # Direct reference, NO step prefix
          type: string
      dataSource: $.steps.get_data.output.data
```

### 5. Expression Context Depends on Location

| Location | Expression Format | Example |
|----------|------------------|---------|
| Inline in `parameters.fields` | Direct field reference | `$.email`, `$.work.department` |
| Action-level `fieldConfigs` | Step ID prefix required | `$.get_employees.email` |

### 6. Never Suggest User-Side Mapping

The entire purpose of unified connectors is standardized output. Never suggest users handle mapping in application code.

### 7. Verify Every Path Against Raw Response

Never assume response structure. Always run with `--debug` first:

```bash
stackone run --debug --connector <file> --credentials <file> --action-id <action>
```

## Instructions

### Step 1: Resolve Schema

**Check for existing schema skill first:**

```bash
ls .claude/skills/*schema*.md .claude/skills/schemas/*.md 2>/dev/null
```

- **If skill exists**: Use it immediately, confirm briefly, proceed to Step 2
- **If no skill**: Ask user for schema in any format (YAML, JSON, markdown table, field list)

After receiving schema, offer to save as skill for future reuse.

**Schema must include:**
- All required fields with types
- Enum values for enum fields
- Nested object structures

### Step 2: Research Provider Endpoints (MANDATORY)

**Do not skip this step.** Research ALL available endpoints before proceeding.

For each endpoint, document:
- **Field Coverage**: Which schema fields does it return?
- **Performance**: Pagination support, rate limits
- **Permissions**: Required scopes (narrower is better)
- **Deprecation**: Never use deprecated endpoints

### Step 3: Present Options to User (CHECKPOINT)

Present a comparison table and get explicit user approval before implementing:

```markdown
| Option | Endpoint | Field Coverage | Permissions | Status |
|--------|----------|----------------|-------------|--------|
| A | GET /v2/employees | 70% | Narrow | Active |
| B | POST /reports | 100% | Moderate | Active |
| C | POST /v1/data | 100% | Broad | Deprecated |

Recommendation: Option B - Full coverage, not deprecated
```

**Do not proceed without user selection.**

### Step 4: Configure Scopes

Use `scopeDefinitions` (not `scope_definitions`):

```yaml
scopeDefinitions:
  employees:read:
    description: Read employee data
  employees:read_extended:
    description: Extended employee data
    includes: employees:read  # Scope inheritance
```

**Principles:**
- Narrower scopes always preferred
- Never use deprecated endpoints
- Document trade-offs explicitly

See `references/scope-patterns.md` for detailed patterns.

### Step 5: Map Fields to Schema

Use inline fields in map_fields parameters:

```yaml
steps:
  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        fields:
          - targetFieldKey: id
            expression: $.id
            type: string
          - targetFieldKey: email
            expression: $.email
            type: string
          - targetFieldKey: department
            expression: $.work.department  # Nested field
            type: string
          - targetFieldKey: status
            expression: $.status
            type: enum
            enumMapper:
              matcher:
                - matchExpression: '{{$.status == "Active"}}'
                  value: active
                - matchExpression: '{{$.status == "Inactive"}}'
                  value: inactive
                - matchExpression: '{{$.status == null}}'
                  value: unknown
        dataSource: $.steps.get_data.output.data

  - stepId: typecast_data
    stepFunction:
      functionName: typecast
      version: '2'
      parameters:
        fields:
          - targetFieldKey: id
            type: string
          - targetFieldKey: email
            type: string
          - targetFieldKey: department
            type: string
          - targetFieldKey: status
            type: enum
        dataSource: $.steps.map_data.output.data

result:
  data: $.steps.typecast_data.output.data
```

See `references/field-mapping-patterns.md` for enum mapping, nested objects, and transformations.

### Step 6: Configure Pagination

For list endpoints, use cursor pagination with the `request` function:

```yaml
cursor:
  enabled: true
  pageSize: 50

inputs:
  - name: page_size
    type: number
    in: query
    required: false
  - name: cursor
    type: string
    in: query
    required: false

steps:
  - stepId: get_data
    stepFunction:
      functionName: request
      parameters:
        url: /items
        method: get
        args:
          # Dual-condition pattern for defaults
          - name: limit
            value: $.inputs.page_size
            in: query
            condition: "{{present(inputs.page_size)}}"
          - name: limit
            value: 50
            in: query
            condition: "{{!present(inputs.page_size)}}"
          - name: cursor
            value: $.inputs.cursor
            in: query
            condition: "{{present(inputs.cursor)}}"

result:
  data: $.steps.typecast_data.output.data
  next: $.steps.get_data.output.data.meta.nextCursor
```

**Important:** Use `request` function (not `paginated_request`) when you need dynamic inputs like `page_size`. The `paginated_request` function can have issues with `$.inputs.*` resolving to `undefined`.

See `references/pagination-patterns.md` for detailed configuration.

### Step 7: Validate Configuration

```bash
stackone validate connectors/<provider>/<provider>.connector.s1.yaml
```

### Step 8: Test Mappings

**Phase 1: Raw Response**
```bash
stackone run --debug --connector <file> --credentials <file> --action-id <action>
```

**Phase 2: Field Mapping** - Verify all fields use YOUR schema names, not provider names

**Phase 3: Pagination** - Test first page, next page, last page, empty results

**Phase 4: Schema Completeness** - All required fields present and populated

### Step 9: Document Coverage

Create a coverage document listing:
- Required fields: mapped status
- Optional fields: mapped or documented why not
- Scopes required
- Limitations

## Examples

### Example 1: Building a unified employee connector

User says: "start unified build for BambooHR"

Actions:
1. Check for existing schema skill in `.claude/skills/schemas/`
2. If no skill, ask: "What's your target schema? Share field requirements in any format."
3. Research BambooHR endpoints: `/v1/employees`, `/v1/employees/directory`, custom reports
4. Present options with trade-offs (field coverage, scopes, deprecation)
5. After user selects, implement map_fields with inline fields
6. Configure pagination with cursor support
7. Test with `--debug`, verify field names match schema
8. Document coverage

Result: Working unified connector with standardized employee schema.

### Example 2: Debugging field mapping issues

User says: "My unified connector returns provider field names instead of my schema"

Actions:
1. Check if `targetFieldKey` uses YOUR schema names (not provider names)
2. Verify `version: '2'` is specified on map_fields and typecast
3. Check expression context - inline fields should NOT have step prefix
4. Run with `--debug` to see raw response structure
5. Verify dataSource path is correct

Result: Fields correctly mapped to user's schema.

### Example 3: Pagination not working

User says: "Pagination cursor isn't being passed correctly"

Actions:
1. Run with `--debug` to see raw response structure
2. Verify `dataKey` path matches actual response (e.g., `data.employees` not just `employees`)
3. Verify `nextKey` path points to cursor value
4. Check if using `paginated_request` with dynamic inputs - switch to `request` with dual-condition pattern
5. Verify `result.next` returns the cursor value

Result: Working pagination with correct cursor handling.

## Troubleshooting

### Fields return provider names instead of schema names
**Cause**: Missing or incorrect field mapping configuration.
**Fix**: Ensure `targetFieldKey` uses YOUR schema field names, not provider names. Verify map_fields step is present and dataSource is correct.

### Mapping produces empty results
**Cause**: Missing `version: '2'` or wrong expression context.
**Fix**: Add `version: '2'` to map_fields and typecast. For inline fields, use direct references (`$.email`) without step prefix.

### Enum values not translating
**Cause**: `matchExpression` doesn't match provider values (case-sensitive).
**Fix**: Check exact provider values with `--debug`. Use `.toLowerCase()` for case-insensitive matching. Always include null/unknown fallback.

### Pagination returns same records
**Cause**: Cursor not being sent or extracted correctly.
**Fix**: Verify `iterator.key` matches API's expected parameter name. Check `nextKey` path against raw response. Verify `iterator.in` is correct (query/body/headers).

### Build fails with schema inference errors
**Cause**: Action-level `fieldConfigs` triggering unwanted schema inference.
**Fix**: Use inline fields in `map_fields` parameters instead of action-level `fieldConfigs`.

### Dynamic inputs resolve to undefined
**Cause**: Using `paginated_request` which doesn't handle `$.inputs.*` well.
**Fix**: Use standard `request` function with dual-condition pattern for defaults.

## Key URLs

| Resource | URL |
|----------|-----|
| CLI Package | https://www.npmjs.com/package/@stackone/cli |
| Connector Engine Docs | https://docs.stackone.com/guides/connector-engine |
| CLI Reference | https://docs.stackone.com/guides/connector-engine/cli-reference |

## Related Skills

- **stackone-cli**: For deploying connectors and CLI commands
- **stackone-connectors**: For discovering existing connector capabilities
- **stackone-agents**: For building AI agents that use connectors
