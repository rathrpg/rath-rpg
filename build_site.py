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
RULES_DIR = SCRIPT_DIR / "../.."
SUPPLEMENT_DIR = RULES_DIR / "Supplement"
DOCS_DIR = SCRIPT_DIR / "docs"
PUBLISHING_DIR = SCRIPT_DIR / ".."

# Files to copy (source path relative to RULES_DIR -> destination name)
FILES = {
    "Players Handbook.md": "Players Handbook.md",
    "GM Handbook.md": "GM Handbook.md",
    "Advanced Aptitudes.md": "Advanced Aptitudes.md",
    "Advanced Magic.md": "Advanced Magic.md",
    "Rath Overdrive.md": "Rath Overdrive.md",
    "Freehand/Rath Freehand.md": "Rath Freehand.md",
}

# The Players Handbook carries Modern and Science Fiction as appendices. In print
# that's correct — players need the aptitude and equipment lists at character
# creation. On the web there are no page counts, so each setting gets its own page
# and the Players Handbook page stays about the core game.
#
# (start_marker, end_marker, destination, page title)
APPENDIX_SPLITS = [
    ("# Appendix A: Modern", "# Appendix B: Science Fiction",
     "Modern.md", "Modern"),
    ("# Appendix B: Science Fiction", "## Quick Reference",
     "Science Fiction.md", "Science Fiction"),
]

# Supplement files (from Supplement folder)
SUPPLEMENT_FILES = {
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

    return content


def split_appendices():
    """Publish the PHB's setting appendices as standalone pages.

    The Players Handbook page keeps its appendices too — they are part of the
    book — but each setting also gets its own entry so it can be linked and
    found directly. Nothing is removed from the source file.
    """
    phb = DOCS_DIR / "Players Handbook.md"
    if not phb.exists():
        print("  WARNING: Players Handbook.md not in docs, skipping appendix split")
        return

    content = phb.read_text(encoding='utf-8')

    for start, end, dest_name, title in APPENDIX_SPLITS:
        if start not in content or end not in content:
            print(f"  WARNING: could not locate {dest_name} boundaries, skipping")
            continue

        begin = content.index(start)
        section = content[begin:content.index(end, begin + len(start))]

        appendix_label = start.split(':')[0].replace('# ', '')
        header = "\n".join([
            f"# {title}",
            "",
            f"*This is {appendix_label} of the "
            "[Players Handbook](Players Handbook.md). The core rules — tests, "
            "combat, character creation — are the same for every setting; only "
            "the aptitudes, keywords, and equipment change.*",
            "",
            "See **[Mixing Settings](Players Handbook.md#7-mixing-settings)** "
            "for running more than one at the same table.",
            "",
            "---",
            "",
            "",
        ])

        # drop the original top-level heading; the new one replaces it
        body = section.split("\n", 1)[1].lstrip("\n")
        (DOCS_DIR / dest_name).write_text(header + body, encoding='utf-8')
        print(f"  Split: Players Handbook -> {dest_name}")


def copy_files():
    """Copy and process markdown files to docs folder."""
    print("Copying files to docs folder...")

    # Ensure docs folder exists
    DOCS_DIR.mkdir(exist_ok=True)

    # Ensure stylesheets folder exists
    stylesheets_dir = DOCS_DIR / "stylesheets"
    stylesheets_dir.mkdir(exist_ok=True)

    # Copy main rules files
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

    # Split the Players Handbook's setting appendices into their own pages
    split_appendices()

    # Copy supplement files
    for src_name, dest_name in SUPPLEMENT_FILES.items():
        src_path = SUPPLEMENT_DIR / src_name
        dest_path = DOCS_DIR / dest_name

        if not src_path.exists():
            print(f"  WARNING: Supplement/{src_name} not found")
            continue

        # Read, process, and write
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()

        content = process_markdown(content, dest_name)

        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  Copied: Supplement/{src_name} -> {dest_name}")

    print("Done!")


def copy_pdfs():
    """Copy PDF files to docs/downloads folder."""
    print("\nCopying PDFs to downloads folder...")

    downloads_dir = DOCS_DIR / "downloads"
    downloads_dir.mkdir(exist_ok=True)

    # Copy from Output/PDF
    pdf_dir = PUBLISHING_DIR / "Output" / "PDF"
    if pdf_dir.exists():
        for pdf in pdf_dir.glob("*.pdf"):
            dest = downloads_dir / pdf.name
            shutil.copy2(pdf, dest)
            print(f"  Copied: {pdf.name}")

    # Copy from Output/Booklets
    booklets_dir = PUBLISHING_DIR / "Output" / "Booklets"
    if booklets_dir.exists():
        for pdf in booklets_dir.glob("*.pdf"):
            dest = downloads_dir / pdf.name
            shutil.copy2(pdf, dest)
            print(f"  Copied: {pdf.name}")

    # Rath Freehand builds from its own pipeline, so its output lives elsewhere
    freehand_out = RULES_DIR / "Freehand" / "Publishing" / "Output"
    if freehand_out.exists():
        for sub in ("PDF", "Booklets"):
            for pdf in (freehand_out / sub).glob("*.pdf"):
                shutil.copy2(pdf, downloads_dir / pdf.name)
                print(f"  Copied: {pdf.name}")
    else:
        print("  WARNING: Freehand output not found — run its build first")

    # Copy character sheets from Rath Character Sheets folder
    sheets_dir = RULES_DIR / "Rath Character Sheets"
    if sheets_dir.exists():
        for pdf in sheets_dir.glob("*.pdf"):
            dest = downloads_dir / pdf.name
            shutil.copy2(pdf, dest)
            print(f"  Copied: {pdf.name}")

    print("PDFs copied!")


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
    copy_pdfs()

    if '--serve' in args:
        serve_site()
    elif '--deploy' in args:
        build_site()
        deploy_site()
    else:
        build_site()


if __name__ == '__main__':
    main()
