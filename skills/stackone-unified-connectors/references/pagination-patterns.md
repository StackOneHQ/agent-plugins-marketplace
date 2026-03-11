# Pagination Patterns Reference

**IMPORTANT**: This reference may become outdated. Always verify pagination paths against actual API responses with `--debug`.

## Action-Level Configuration

```yaml
cursor:
  enabled: true
  pageSize: 50  # Must be within API's max limit
```

## Recommended: request Function with Manual Cursor

Use `request` function when you need dynamic inputs like `page_size`:

```yaml
inputs:
  - name: page_size
    description: Maximum items per page
    type: number
    in: query
    required: false
  - name: cursor
    description: Pagination cursor
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
          # Pass cursor when present
          - name: cursor
            value: $.inputs.cursor
            in: query
            condition: "{{present(inputs.cursor)}}"

result:
  data: $.steps.typecast_data.output.data
  next: $.steps.get_data.output.data.meta.nextCursor
```

**Why this approach?** The `paginated_request` function can have issues with `$.inputs.*` resolving to `undefined`.

## Alternative: paginated_request Function

Use only when you don't need dynamic input parameters:

```yaml
stepFunction:
  functionName: paginated_request
  parameters:
    url: /v2/employees
    method: get
    response:
      dataKey: data.employees       # EXACT path to data array
      nextKey: meta.pagination.next # EXACT path to cursor
      indexField: id                # Unique identifier field
    iterator:
      key: page_token               # API's expected parameter NAME
      in: query                     # WHERE to send cursor
```

## Configuration Fields

### response.dataKey

Path to the data array in API response.

```yaml
# If response is: { "data": { "employees": [...] } }
response:
  dataKey: data.employees    # NOT just "employees"
```

### response.nextKey

Path to the pagination cursor.

```yaml
# If response is: { "meta": { "cursor": "abc123" } }
response:
  nextKey: meta.cursor
```

### response.indexField

Unique identifier field in each record. Usually `id`.

```yaml
response:
  indexField: id
  # or if provider uses different name:
  indexField: employee_id
```

### iterator.key

The parameter name the API expects for the cursor.

```yaml
# If API expects ?page_token=xxx
iterator:
  key: page_token    # Match API's expected param
```

### iterator.in

Where to send the cursor: `query`, `body`, or `headers`.

```yaml
iterator:
  key: cursor
  in: query     # Most common
  # in: body    # Some APIs want cursor in request body
```

## Verification Process

```bash
# 1. Get raw response to verify structure
stackone run --debug \
  --connector <file> \
  --credentials <file> \
  --action-id list_employees

# 2. Examine response structure
# If response is:
# {
#   "data": {
#     "employees": [...],
#     "meta": { "next_page": "abc123" }
#   }
# }
#
# Then:
#   dataKey: data.employees
#   nextKey: data.meta.next_page
```

## Testing Checklist

### Test 1: First Page

```bash
stackone run --connector <file> --credentials <file> \
  --action-id list_items --params '{"limit": 2}'
```

Verify:
- [ ] Data array returned
- [ ] Correct number of records
- [ ] Cursor present in response

### Test 2: Next Page

```bash
stackone run --connector <file> --credentials <file> \
  --action-id list_items --params '{"cursor": "<cursor_from_previous>"}'
```

Verify:
- [ ] Different records returned
- [ ] No duplicates from page 1
- [ ] New cursor (or null if last page)

### Test 3: Last Page

Verify:
- [ ] Cursor is null/empty/absent
- [ ] No error on final page

### Test 4: Empty Results

```bash
stackone run --connector <file> --credentials <file> \
  --action-id list_items --params '{"filter": "nonexistent"}'
```

Verify:
- [ ] Empty array returned (not null/error)
- [ ] Cursor is null/absent

## Common Issues

### dataKey path incorrect

```yaml
# Response: { "data": { "employees": [...] } }

# WRONG
response:
  dataKey: employees

# CORRECT
response:
  dataKey: data.employees
```

### nextKey path incorrect

```yaml
# Response: { "pagination": { "next_cursor": "abc" } }

# WRONG
response:
  nextKey: cursor

# CORRECT
response:
  nextKey: pagination.next_cursor
```

### iterator.key doesn't match API

```yaml
# API expects ?page_token=xxx

# WRONG
iterator:
  key: cursor

# CORRECT
iterator:
  key: page_token
```

### Dynamic inputs resolve to undefined

```yaml
# WRONG - paginated_request with $.inputs
stepFunction:
  functionName: paginated_request
  parameters:
    args:
      - name: limit
        value: $.inputs.page_size  # May be undefined!

# CORRECT - request with dual-condition
stepFunction:
  functionName: request
  parameters:
    args:
      - name: limit
        value: $.inputs.page_size
        condition: "{{present(inputs.page_size)}}"
      - name: limit
        value: 50
        condition: "{{!present(inputs.page_size)}}"
```

### Missing next in result block

```yaml
# WRONG - cursor not returned
result:
  data: $.steps.typecast_data.output.data

# CORRECT - include next cursor
result:
  data: $.steps.typecast_data.output.data
  next: $.steps.get_data.output.data.meta.nextCursor
```

## Quick Validation

| Field | What to Verify | How |
|-------|----------------|-----|
| `cursor.enabled` | Set to `true` | Check action config |
| `cursor.pageSize` | Within API limit | Check API docs |
| `dataKey` | Exact path to array | `--debug` output |
| `nextKey` | Exact path to cursor | `--debug` output |
| `iterator.key` | API's expected param | API documentation |
| `result.next` | Returns cursor | Check result block |
