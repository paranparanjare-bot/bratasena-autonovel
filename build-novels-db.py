#!/usr/bin/env python3
"""
Bratasena — Novel Database Builder
====================================
Scan the novels/ directory and generate novels.json index.
Usage: python3 build-novels-db.py

Structure:
  novels/
    novels.json          ← auto-generated
    bratasena/            ← novel folder (id = folder name)
      cover.jpg           ← optional cover image
      season-01/          ← season subfolder
        bab-001.txt
        bab-002.txt
      season-02/
      ...

To add a new novel: create a folder under novels/, put chapters in season-*/ subfolders,
then run this script. It auto-generates the index.
"""

import json
import re
import os
from pathlib import Path

NOVELS_DIR = Path(__file__).resolve().parent / 'novels'
OUTPUT_FILE = NOVELS_DIR / 'novels.json'
CHAPTER_FILE_PATTERN = re.compile(r'(?:bab|ch)[\s\-_]?(\d+)', re.IGNORECASE)
SEASON_PATTERN = re.compile(r'season[-_](\d+)', re.IGNORECASE)


def extract_chapter_num(filename):
    """Extract chapter number from filename like bab-01.txt, bratasena-s1-bab01.txt, etc."""
    stem = Path(filename).stem
    # Try to match chapter number
    m = CHAPTER_FILE_PATTERN.search(stem)
    if m:
        return int(m.group(1))
    # Try just digits at start or end
    digits = re.findall(r'\d+', stem)
    if digits:
        return int(digits[-1])
    return 0


def extract_title(filepath):
    """Try to extract title from the first few lines of a chapter."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = [f.readline().strip() for _ in range(10)]
        for line in lines:
            line = line.strip('-#* \t')
            if line and len(line) > 3 and len(line) < 120:
                return line
    except:
        pass
    return ''


def scan_novel(novel_dir):
    """Scan a novel directory and return its metadata + seasons."""
    novel_id = novel_dir.name
    name_parts = novel_id.replace('-', ' ').replace('_', ' ').title()
    
    # Try to read a README or info file
    info_file = novel_dir / 'info.json'
    info = {}
    if info_file.exists():
        try:
            info = json.loads(info_file.read_text(encoding='utf-8'))
        except:
            pass

    seasons = []
    total_chapters = 0

    # Scan season subdirectories
    season_dirs = sorted(
        [d for d in novel_dir.iterdir() if d.is_dir() and not d.name.startswith('.')],
        key=lambda d: (
            int(m.group(1)) if (m := SEASON_PATTERN.search(d.name)) else 999,
            d.name
        )
    )

    first_chapter_file = None

    for season_dir in season_dirs:
        season_match = SEASON_PATTERN.search(season_dir.name)
        season_num = int(season_match.group(1)) if season_match else 0

        # Get all chapter files sorted by chapter number
        chapter_files = sorted(
            [f for f in season_dir.iterdir() if f.suffix.lower() in ('.txt', '.md')],
            key=lambda f: (extract_chapter_num(f.name), f.name)
        )

        chapters = []
        for cf in chapter_files:
            num = extract_chapter_num(cf.name)
            # Try to get title from info.json chapters mapping, fallback to reading file
            title_entry = info.get('chapters', {}).get(str(num), None)
            if isinstance(title_entry, dict):
                title = title_entry.get('title', '')
            elif isinstance(title_entry, str):
                title = title_entry
            else:
                title = ''

            if not title:
                title = extract_title(cf)
            chapters.append({
                "num": num,
                "title": title,
                "file": cf.name,
                "path": f"{novel_id}/{season_dir.name}/{cf.name}"
            })
            if not first_chapter_file:
                first_chapter_file = cf
            total_chapters += 1

        season_label = info.get('seasons', {}).get(season_dir.name, f"Season {season_num}")
        season_cover = info.get('season_covers', {}).get(season_dir.name, None)
        
        seasons.append({
            "season": season_dir.name,
            "name": season_label,
            "path": season_dir.name,
            "cover": season_cover,
            "chapters": chapters
        })

    # Cover image logic:
    # 1. Look in info.json 'cover' field
    # 2. Look for cover.jpg/.png etc. in folder
    # 3. Fallback to the cover of the first season
    cover = info.get('cover', None)
    if not cover:
        for ext in ('.jpg', '.jpeg', '.png', '.webp'):
            candidate = novel_dir / f'cover{ext}'
            if candidate.exists():
                cover = f"novels/{novel_id}/cover{ext}"
                break
    if not cover and seasons:
        cover = seasons[0].get('cover', None)

    return {
        "id": novel_id,
        "title": info.get('title', name_parts),
        "author": info.get('author', 'paranparanjare-bot'),
        "description": info.get('description', ''),
        "genre": info.get('genre', ''),
        "cover": cover,
        "totalChapters": total_chapters,
        "seasons": seasons,
    }


def main():
    if not NOVELS_DIR.exists():
        print(f"Error: {NOVELS_DIR} not found.")
        return 1

    novel_dirs = sorted([
        d for d in NOVELS_DIR.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    ])

    novels = []
    for nd in novel_dirs:
        print(f"Scanning: {nd.name}...")
        try:
            novel_data = scan_novel(nd)
            novels.append(novel_data)
            print(f"  → {novel_data['title']}: {novel_data['totalChapters']} chapters, {len(novel_data['seasons'])} seasons")
        except Exception as e:
            print(f"  ✗ Error: {e}")

    # Sort by total chapters (most content first) or by priority order from info.json
    # Priority: if any novel has a "priority" field in its info.json

    output = {
        "version": "1.0",
        "generated": __import__('datetime').datetime.now().isoformat(),
        "novels": novels,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Database generated: {OUTPUT_FILE}")
    print(f"  {len(novels)} novel(s), {sum(n['totalChapters'] for n in novels)} total chapters")
    return 0


if __name__ == '__main__':
    exit(main())
