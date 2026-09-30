#!/usr/bin/env python3
"""Regenerate the README skill index and the plugin manifests from skill frontmatter.

Usage:
  python3 scripts/sync.py          # rewrite files in place
  python3 scripts/sync.py --check  # exit 1 if anything is out of date (for CI)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_skills import ROOT, load_skills  # noqa: E402

VERSION_FILE = ROOT / "VERSION"
README = ROOT / "README.md"
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"
START, END = "<!-- SKILLS:START -->", "<!-- SKILLS:END -->"

CATEGORY_TITLES = {
    "meta": "Start here",
    "engineering": "Engineering — architecture, clean code, scalability",
    "design": "Design — product UI, UX, design systems (web-first)",
    "mobile": "Mobile — iOS 26, Android 16, cross-platform",
}
PLUGINS = {
    "engineering": "Architecture, design patterns, clean code, scalability, reliability, APIs, testing, and AI-native systems.",
    "design": "Product design for 2026: taste, foundations, design systems, UX laws, interaction, motion, accessibility, conversion, and AI interfaces.",
    "mobile": "2026 mobile design and architecture: iOS 26 Liquid Glass, Material 3 Expressive, and cross-platform apps.",
}


def first_sentence(desc: str) -> str:
    text = desc.removeprefix("Use when ").strip()
    cut = text.find(". ")
    text = text if cut == -1 else text[:cut]
    return (text[0].upper() + text[1:]).rstrip(".") if text else ""


def build_readme_block(skills) -> str:
    rows = [START, ""]
    for category, title in CATEGORY_TITLES.items():
        members = [(n, m) for n, (_, m, _) in skills.items() if m.get("metadata", {}).get("category") == category]
        if not members:
            continue
        rows += [f"### {title}", "", "| Skill | Use when |", "|---|---|"]
        for name, meta in members:
            rows.append(f"| [`{name}`](skills/{name}/SKILL.md) | {first_sentence(meta['description'])} |")
        rows.append("")
    rows.append(END)
    return "\n".join(rows)


def build_marketplace(skills, version: str) -> dict:
    meta_skills = [n for n, (_, m, _) in skills.items() if m["metadata"]["category"] == "meta"]
    plugins = [
        {
            "name": "how-to-build-software",
            "description": "Every skill in the collection: engineering, design, and mobile.",
            "source": "./",
            "strict": False,
            "skills": [f"./skills/{n}" for n in skills],
        }
    ]
    for category, description in PLUGINS.items():
        members = meta_skills + [n for n, (_, m, _) in skills.items() if m["metadata"]["category"] == category]
        plugins.append(
            {
                "name": f"{category}-skills",
                "description": description,
                "source": "./",
                "strict": False,
                "skills": [f"./skills/{n}" for n in members],
            }
        )
    return {
        "name": "how-to-build-software",
        "owner": {"name": "LucSena", "url": "https://github.com/LucSena"},
        "metadata": {
            "description": "Agent Skills for software architecture, clean code, scalability, and 2026 web and mobile design.",
            "version": version,
            "repository": "https://github.com/LucSena/how-to-build-software",
        },
        "plugins": plugins,
    }


def main() -> int:
    check = "--check" in sys.argv
    skills = load_skills()
    version = VERSION_FILE.read_text(encoding="utf-8").strip()
    stale = []

    readme = README.read_text(encoding="utf-8")
    if START not in readme or END not in readme:
        print(f"README.md is missing {START} / {END} markers")
        return 1
    head, rest = readme.split(START, 1)
    _, tail = rest.split(END, 1)
    new_readme = head + build_readme_block(skills) + tail
    if new_readme != readme:
        stale.append(README)
        if not check:
            README.write_text(new_readme, encoding="utf-8")

    manifest = json.dumps(build_marketplace(skills, version), indent=2) + "\n"
    old = MARKETPLACE.read_text(encoding="utf-8") if MARKETPLACE.exists() else ""
    if manifest != old:
        stale.append(MARKETPLACE)
        if not check:
            MARKETPLACE.parent.mkdir(exist_ok=True)
            MARKETPLACE.write_text(manifest, encoding="utf-8")

    for path in stale:
        print(f"{'out of date' if check else 'updated'}: {path.relative_to(ROOT)}")
    if check and stale:
        print("run: python3 scripts/sync.py")
        return 1
    if not stale:
        print("everything in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())
