#!/usr/bin/env python3
"""
Build the Rath RPG MkDocs website.

Copies Markdown files from Rath - Rules to the docs folder,
processes them for MkDocs compatibility, and optionally builds/serves the site.

Usage:
    python build_site.py          # Copy files and build
    python build_site.py --serve  # Copy files and start dev server
    python build_site.py --deploy # Copy files and deploy to GitHub Pages
"""

import os
import sys
import re
import shutil
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
RULES_DIR = SCRIPT_DIR / "../../Rath - Rules"
DOCS_DIR = SCRIPT_DIR / "docs"

# Files to copy (source name -> destination name)
FILES = {
    "Blog Note.md": "index.md",
    "Core Rules Reference.md": "Core Rules Reference.md",
    "Character Creation Guide.md": "Character Creation Guide.md",
    "Aptitude Reference.md": "Aptitude Reference.md",
    "Magic Reference.md": "Magic Reference.md",
    "Equipment Reference.md": "Equipment Reference.md",
    "GM Reference.md": "GM Reference.md",
    "Homebrew Guide.md": "Homebrew Guide.md",
    "License and Attribution.md": "License and Attribution.md",
}


def process_markdown(content, filename):
    """Process markdown for MkDocs compatibility."""

    # Remove Obsidian wiki-links and convert to standard markdown links
    # [[Page Name]] -> [Page Name](Page Name.md)
    # [[Page Name|Display Text]] -> [Display Text](Page Name.md)
    content = re.sub(
        r'\[\[([^\]|]+)\|([^\]]+)\]\]',
        r'[\2](\1.md)',
        content
    )
    content = re.sub(
        r'\[\[([^\]]+)\]\]',
        r'[\1](\1.md)',
        content
    )

    # Fix any broken internal links to reference files
    for src, dest in FILES.items():
        src_name = src.replace('.md', '')
        dest_name = dest.replace('.md', '')
        if src_name != dest_name:
            content = content.replace(f']({src_name}.md)', f']({dest_name}.md)')

    return content


def copy_files():
    """Copy and process markdown files to docs folder."""
    print("Copying files to docs folder...")

    # Ensure docs folder exists
    DOCS_DIR.mkdir(exist_ok=True)

    # Ensure stylesheets folder exists
    stylesheets_dir = DOCS_DIR / "stylesheets"
    stylesheets_dir.mkdir(exist_ok=True)

    for src_name, dest_name in FILES.items():
        src_path = RULES_DIR / src_name
        dest_path = DOCS_DIR / dest_name

        if not src_path.exists():
            print(f"  WARNING: {src_name} not found")
            continue

        # Read, process, and write
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()

        content = process_markdown(content, dest_name)

        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  Copied: {src_name} -> {dest_name}")

    print("Done!")


def build_site():
    """Build the MkDocs site."""
    print("\nBuilding site...")
    os.chdir(SCRIPT_DIR)
    subprocess.run(["mkdocs", "build"], check=True)
    print("Site built! Output in 'site' folder.")


def serve_site():
    """Start the MkDocs development server."""
    print("\nStarting development server...")
    print("Open http://127.0.0.1:8000 in your browser")
    print("Press Ctrl+C to stop")
    os.chdir(SCRIPT_DIR)
    subprocess.run(["mkdocs", "serve"])


def deploy_site():
    """Deploy to GitHub Pages."""
    print("\nDeploying to GitHub Pages...")
    os.chdir(SCRIPT_DIR)
    subprocess.run(["mkdocs", "gh-deploy", "--force"], check=True)
    print("Deployed!")


def main():
    args = sys.argv[1:]

    # Always copy files first
    copy_files()

    if '--serve' in args:
        serve_site()
    elif '--deploy' in args:
        build_site()
        deploy_site()
    else:
        build_site()


if __name__ == '__main__':
    main()
