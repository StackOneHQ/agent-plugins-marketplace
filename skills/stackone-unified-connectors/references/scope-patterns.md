# Scope Patterns Reference

**IMPORTANT**: This reference may become outdated. Always verify scope requirements against provider API documentation.

## Core Principles

1. **Narrower scopes always preferred** - Request only what's needed
2. **Never use deprecated endpoints** - Even if they seem easier
3. **Document trade-offs explicitly** - Users should understand choices
4. **Required fields drive minimum scopes** - Optional fields may need additional scopes

## Scope Definition Syntax

```yaml
scopeDefinitions:
  employees:read:
    description: Read employee basic information
```

**Use `scopeDefinitions`** (camelCase), NOT `scope_definitions`.

## Scope Hierarchy

Use `includes` for scope inheritance:

```yaml
scopeDefinitions:
  employees:read:
    description: Read basic employee data

  employees:extended:read:
    description: Extended employee data including compensation
    includes: employees:read  # Inherits base scope

  employees:write:
    description: Create and update employees
    includes: employees:read  # Write implies read
```

## Action-Level Scopes

```yaml
- actionId: list_employees
  requiredScopes: employees:read
```

## Field-Level Scopes

For fields requiring additional permissions:

```yaml
fieldConfigs:
  - targetFieldKey: salary
    expression: $.compensation.salary
    type: number
    requiredScopes: employees:compensation:read
```

## Decision Framework

### Step 1: Categorize Required Fields

| Category | Description | Example |
|----------|-------------|---------|
| **Critical** | Must have for core functionality | id, name, email |
| **Important** | High value but not blocking | department, hire_date |
| **Nice-to-have** | Additional context | office_location |

### Step 2: Map Fields to Endpoints

| Field | /v2/employees | /v2/employees/detailed | /v2/org/members |
|-------|---------------|------------------------|-----------------|
| id | Yes | Yes | Yes |
| first_name | Yes | Yes | Yes |
| department | No | Yes | Yes |
| salary | No | Yes | No |

### Step 3: Map Endpoints to Scopes

| Endpoint | Required Scopes | Notes |
|----------|-----------------|-------|
| /v2/employees | employees:read | Basic access |
| /v2/employees/detailed | employees:read, employees:compensation:read | Includes salary |
| /v2/org/members | employees:read, org:read | Cross-org data |

### Step 4: Decision Tree

```
Can ALL critical fields be obtained with narrowest scope?
├─ YES → Use that endpoint
└─ NO → Continue

Are there deprecated endpoints with the data?
├─ YES → DO NOT USE. Find alternative.
└─ NO → Continue

Can critical fields be obtained with 2 endpoints?
├─ YES → Evaluate scope combination
│   ├─ Combined scopes still narrower? → Use both
│   └─ Single broader scope simpler? → Document trade-off, ask user
└─ NO → Continue

Must request broader scope for critical field?
├─ YES → Request broader scope, document reason
└─ NO → Continue

Important/nice-to-have fields need broader scope?
├─ YES → Make optional, document "requires additional scope"
└─ NO → Include in mapping
```

## Trade-off Analysis Template

```markdown
## Scope Analysis: [Provider Name]

### Minimum Viable Scopes
Required for critical fields only:
- `employees:read` - Basic data (id, name, email)

### Recommended Scopes
Includes important fields:
- `employees:read` - Basic data
- `employees:extended:read` - Department, title, hire date

### Full Feature Scopes
All available fields:
- `employees:read`
- `employees:extended:read`
- `employees:compensation:read` - Salary
- `org:read` - Organizational hierarchy

### Trade-off Summary
| Level | Fields Available | Security Impact |
|-------|------------------|-----------------|
| Minimum | id, name, email | Lowest risk |
| Recommended | + department, title | Low risk |
| Full | + salary, reports_to | Higher risk |

### Recommendation
Start with **Recommended**. Add compensation scope only if salary is critical.
```

## Performance vs Scope Trade-offs

### Scenario: Multiple Endpoints vs Broader Scope

```markdown
### Option A: Two Narrow-Scope Endpoints
- /v2/employees (employees:read) → basic data
- /v2/employees/extended (employees:extended:read) → additional data
- Total: 2 API calls, narrower scopes

### Option B: One Broader-Scope Endpoint
- /v2/employees/full (employees:full:read) → all data
- Total: 1 API call, broader scope

### Analysis
| Factor | Option A | Option B |
|--------|----------|----------|
| API calls | 2x | 1x |
| Rate limit impact | 2x | 1x |
| Scope breadth | Narrower | Broader |
| Data exposure | Less | More |

### Decision
| Priority | Recommendation |
|----------|----------------|
| Security > Performance | Option A |
| Performance > Security | Option B |
```

## Deprecated Endpoint Handling

### Never Use Deprecated Endpoints

Even if they:
- Have better data
- Require fewer scopes
- Are "still working"

### What To Do Instead

1. **Find replacement endpoint:**
```yaml
# OLD (Deprecated): /v1/employees - Removal Q3 2024
# NEW: /v2/employees
```

2. **If replacement has different scope requirements:**
```markdown
### Migration Impact
v2 API requires `employees:extended:read` for department data.
v1 only needed `employees:read`.

Recommendation: Request additional scope rather than use deprecated v1.
```

3. **If replacement is missing fields:**
```markdown
### Field Gap
Deprecated /v1/employees included `legacy_id`.
New /v2/employees does not.

Options:
1. Use /v2/employees/mappings for legacy_id (+1 API call)
2. Document that legacy_id is unavailable
3. Contact provider about alternative
```

## Common Scope Patterns by Category

### HRIS Connectors

```yaml
scopeDefinitions:
  employees:read:
    description: Read employee directory
  employees:extended:read:
    description: Extended employee data
    includes: employees:read
  employees:compensation:read:
    description: Salary and compensation
  employees:write:
    description: Create and update employees
    includes: employees:read
  org:read:
    description: Organization structure
  time_off:read:
    description: PTO and leave data
```

### CRM Connectors

```yaml
scopeDefinitions:
  contacts:read:
    description: Read contact records
  contacts:write:
    description: Create and update contacts
    includes: contacts:read
  deals:read:
    description: Read deal/opportunity data
  deals:write:
    description: Create and update deals
    includes: deals:read
  activities:read:
    description: Read activities and tasks
```

### ATS Connectors

```yaml
scopeDefinitions:
  candidates:read:
    description: Read candidate profiles
  candidates:write:
    description: Create and update candidates
    includes: candidates:read
  jobs:read:
    description: Read job postings
  jobs:write:
    description: Create and update jobs
    includes: jobs:read
  applications:read:
    description: Read job applications
  assessments:read:
    description: Read assessment results
```

## OAuth2 Scope Configuration

```yaml
authentication:
  - oauth2:
      type: oauth2
      grantType: authorization_code
      authorization:
        scopes: employees:read employees:extended:read  # Space-separated
        scopeDelimiter: ' '  # Some APIs use comma
```

## Validation Checklist

- [ ] Used `scopeDefinitions` (not `scope_definitions`)
- [ ] Documented minimum required scopes
- [ ] No deprecated endpoints used
- [ ] Trade-offs documented for broader scopes
- [ ] Field-level scopes noted where applicable
- [ ] Scope hierarchy defined with `includes`
- [ ] OAuth scope string uses correct delimiter
