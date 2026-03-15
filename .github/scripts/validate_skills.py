#!/usr/bin/env python3
"""Validate all SKILL.md files in the skills/ directory.

Each SKILL.md must have YAML frontmatter (delimited by ---) containing
at least the 'name' and 'description' fields.
"""
import re
import sys
from pathlib import Path

REQUIRED_FIELDS = ["name", "description"]


def validate_skill(path: Path) -> list[str]:
    errors = []
    content = path.read_text(encoding="utf-8")

    if not content.startswith("---"):
        return [f"{path}: missing YAML frontmatter (file must start with ---)"]

    parts = content.split("---", 2)
    if len(parts) < 3:
        return [f"{path}: malformed frontmatter (missing closing ---)"]

    frontmatter = parts[1]
    for field in REQUIRED_FIELDS:
        if not re.search(rf"^{field}\s*:", frontmatter, re.MULTILINE):
            errors.append(f"{path}: missing required frontmatter field '{field}'")

    return errors


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent.parent
    skills_dir = repo_root / "skills"
    if not skills_dir.exists():
        print("No skills/ directory found — skipping.")
        return

    skill_files = sorted(skills_dir.rglob("SKILL.md"))
    if not skill_files:
        print("No SKILL.md files found — skipping.")
        return

    all_errors: list[str] = []
    for path in skill_files:
        all_errors.extend(validate_skill(path))

    if all_errors:
        print("SKILL.md validation failed:\n")
        for error in all_errors:
            print(f"  ✗ {error}")
        sys.exit(1)

    print(f"All {len(skill_files)} SKILL.md file(s) passed validation.")


if __name__ == "__main__":
    main()
