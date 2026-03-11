# Field Mapping Patterns Reference

**IMPORTANT**: This reference may become outdated. Always verify patterns against actual connector behavior with `--debug`.

## Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | Names, IDs, emails |
| `number` | Numeric values | Counts, amounts |
| `boolean` | True/false | is_active |
| `datetime_string` | ISO date strings | hire_date |
| `enum` | Constrained values | status (requires enumMapper) |
| `object` | Nested structure | work_location |

## Inline Fields (Recommended Approach)

Define fields directly in `map_fields` step parameters:

```yaml
- stepId: map_data
  stepFunction:
    functionName: map_fields
    version: '2'
    parameters:
      fields:
        - targetFieldKey: email
          expression: $.email           # Direct reference, NO step prefix
          type: string
        - targetFieldKey: department
          expression: $.work.department  # Nested field reference
          type: string
      dataSource: $.steps.get_data.output.data
```

**Why inline?** Action-level `fieldConfigs` can trigger schema inference that adds unwanted properties, causing build failures.

## Enum Mapping

### Basic Enum

```yaml
fields:
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
```

### Case-Insensitive Matching

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{($.status || "").toLowerCase() == "active"}}'
      value: active
```

### Multiple Source Values

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{$.type == "Full-Time" || $.type == "FT"}}'
      value: full_time
```

### Built-in Mappers

```yaml
- targetFieldKey: file_format
  expression: '{{$.fullFileExtension || $.mimeType}}'
  type: enum
  enumMapper:
    matcher: 'document_file_format_from_extension'
```

### Always Include Fallback

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{$.status == "Active"}}'
      value: active
    - matchExpression: '{{$.status == "Inactive"}}'
      value: inactive
    # ALWAYS include null/unknown fallback
    - matchExpression: '{{$.status == null || $.status == ""}}'
      value: unknown
```

## Nested Objects

### Simple Nested Field

```yaml
fields:
  - targetFieldKey: city
    expression: $.location.city
    type: string
  - targetFieldKey: country
    expression: $.location.country
    type: string
```

### Flattening Nested Data

Provider returns:
```json
{ "work": { "department": "Sales", "title": "Manager" } }
```

Your schema is flat:
```yaml
fields:
  - targetFieldKey: department
    expression: $.work.department
    type: string
  - targetFieldKey: job_title
    expression: $.work.title
    type: string
```

## Array Fields

### Simple Array

```yaml
fields:
  - targetFieldKey: email_addresses
    expression: $.emails[*]
    type: string
    array: true
```

### JEXL Array Operations

```yaml
fields:
  - targetFieldKey: export_formats
    expression: '{{keys(exportLinks)}}'
    type: string
    array: true
```

## Computed/Transformed Fields

### Fallback Values

```yaml
fields:
  - targetFieldKey: file_format
    expression: '{{$.fullFileExtension || $.mimeType}}'
    type: string
```

### Conditional Logic

```yaml
fields:
  - targetFieldKey: default_format
    expression: '{{exportLinks ? (keys(exportLinks)[0] || "application/pdf") : $.mimeType}}'
    type: string
```

### Boolean Check

```yaml
fields:
  - targetFieldKey: is_exportable
    expression: '{{$.exportLinks != null}}'
    type: boolean
```

## Complete Working Example

Mapping HiBob employee data:

```yaml
steps:
  - stepId: get_employees
    stepFunction:
      functionName: paginated_request
      parameters:
        url: /v1/people/search
        method: post
        args:
          - name: fields
            value:
              - root.id
              - root.email
              - work.department
              - work.title
            in: body
        response:
          dataKey: employees
          nextKey: nextCursor
        iterator:
          key: cursor
          in: body

  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        fields:
          - targetFieldKey: email
            expression: $.email
            type: string
          - targetFieldKey: employee_id
            expression: $.id
            type: string
          - targetFieldKey: department
            expression: $.work.department
            type: string
          - targetFieldKey: job_title
            expression: $.work.title
            type: string
        dataSource: $.steps.get_employees.output.data

  - stepId: typecast_data
    stepFunction:
      functionName: typecast
      version: '2'
      parameters:
        fields:
          - targetFieldKey: email
            type: string
          - targetFieldKey: employee_id
            type: string
          - targetFieldKey: department
            type: string
          - targetFieldKey: job_title
            type: string
        dataSource: $.steps.map_data.output.data

result:
  data: $.steps.typecast_data.output.data
```

## Common Mistakes

### Wrong Expression Context

```yaml
# WRONG - Using step prefix in inline fields
parameters:
  fields:
    - expression: $.get_employees.email    # Don't use step prefix!

# CORRECT - Direct field reference
parameters:
  fields:
    - expression: $.email
```

### Missing Version

```yaml
# WRONG - No version
stepFunction:
  functionName: map_fields
  parameters: ...

# CORRECT - Version 2 specified
stepFunction:
  functionName: map_fields
  version: '2'
  parameters: ...
```

### Using Provider Field Names

```yaml
# WRONG - Provider naming
- targetFieldKey: firstName

# CORRECT - YOUR schema naming
- targetFieldKey: first_name
```

## Validation Checklist

- [ ] Using inline `fields` in map_fields parameters
- [ ] Expressions use correct context (no step prefix for inline)
- [ ] `version: '2'` specified for map_fields and typecast
- [ ] All `targetFieldKey` values match YOUR schema
- [ ] All enum fields have `enumMapper` with null handler
- [ ] typecast step includes all mapped fields
