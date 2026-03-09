#!/usr/bin/env python3
"""
Convert katakana producer names to French/English originals.
Fetches items from the Wine Compass API, matches katakana producers
against PRODUCER_MAP, and applies bulk updates.

Usage:
  python scripts/convert_producers.py --dry-run   # Preview changes
  python scripts/convert_producers.py              # Apply changes
"""
import sys, os, json, re, urllib.request, urllib.parse, time

# Add scripts dir to path for import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from producer_vocab import PRODUCER_MAP

BASE = "https://wine-compass.vercel.app"
COOKIE = "wc_auth=1234"

def is_katakana_only(s):
    """Check if string is primarily katakana (with dots, spaces allowed)."""
    if not s:
        return False
    clean = s.replace('・', '').replace(' ', '').replace('　', '').replace('(', '').replace(')', '').replace('（', '').replace('）', '')
    if not clean:
        return False
    for ch in clean:
        cp = ord(ch)
        # Katakana: U+30A0-30FF, Katakana Ext: U+31F0-31FF
        # Also allow: ー (U+30FC), some kanji used in names
        if not (0x30A0 <= cp <= 0x30FF or 0x31F0 <= cp <= 0x31FF
                or ch in 'ーヴ' or ch == '&'
                or '\u4e00' <= ch <= '\u9fff'  # CJK (kanji)
                or '\u3040' <= ch <= '\u309f'  # Hiragana
                ):
            return False
    return True

def normalize(s):
    """Normalize for matching: remove ・, spaces, parens."""
    return s.replace('・', '').replace(' ', '').replace('　', '').replace('(', '').replace(')', '').replace('（', '').replace('）', '')

def find_mapping(producer):
    """Try to find a mapping for the producer name."""
    # 1. Exact match
    if producer in PRODUCER_MAP:
        return PRODUCER_MAP[producer]
    # 2. Normalized match
    np = normalize(producer)
    for k, v in PRODUCER_MAP.items():
        if normalize(k) == np:
            return v
    # 3. Partial match (producer contains a mapped key or vice versa)
    for k, v in PRODUCER_MAP.items():
        nk = normalize(k)
        if len(nk) >= 4 and (np.startswith(nk) or nk.startswith(np)):
            return v
    return None

def api_get(path):
    """GET request to API."""
    url = BASE + path
    req = urllib.request.Request(url, headers={"Cookie": COOKIE})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def api_post(path, data):
    """POST request to API."""
    url = BASE + path
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST',
                                headers={"Cookie": COOKIE, "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def fetch_all_items():
    """Fetch all beverage items from API."""
    items = []
    page = 1
    while True:
        data = api_get(f"/api/beverages?limit=200&page={page}")
        batch = data if isinstance(data, list) else data.get('data', data.get('items', []))
        if not batch:
            break
        items.extend(batch)
        print(f"  Fetched page {page}: {len(batch)} items (total: {len(items)})")
        if len(batch) < 200:
            break
        page += 1
        time.sleep(0.3)
    return items

def main():
    dry_run = '--dry-run' in sys.argv

    print(f"{'DRY RUN' if dry_run else 'LIVE RUN'} - Converting katakana producers to French/English")
    print(f"PRODUCER_MAP has {len(PRODUCER_MAP)} entries")
    print()

    # Fetch all items
    print("Fetching all items from API...")
    items = fetch_all_items()
    print(f"Total items: {len(items)}")
    print()

    # Find items with katakana producers
    to_update = []
    skipped = []
    already_latin = 0
    empty_producer = 0
    no_mapping = []

    for item in items:
        producer = (item.get('producer') or '').strip()
        if not producer:
            empty_producer += 1
            continue
        if not is_katakana_only(producer):
            already_latin += 1
            continue

        mapping = find_mapping(producer)
        if mapping is None:
            no_mapping.append(producer)
            continue
        if mapping == "SKIP":
            skipped.append((item.get('id'), producer))
            continue

        to_update.append({
            'id': item['id'],
            'old_producer': producer,
            'new_producer': mapping,
            'name': item.get('name', ''),
        })

    print(f"Already Latin: {already_latin}")
    print(f"Empty producer: {empty_producer}")
    print(f"To convert: {len(to_update)}")
    print(f"SKIP (non-producer): {len(skipped)}")
    print(f"No mapping found: {len(no_mapping)}")
    print()

    if no_mapping:
        unique_no_map = sorted(set(no_mapping))
        print(f"=== {len(unique_no_map)} unique producers without mapping ===")
        for p in unique_no_map:
            print(f"  {p}")
        print()

    if skipped:
        print(f"=== SKIP entries (will clear producer field) ===")
        for sid, sp in skipped[:20]:
            print(f"  {sp}")
        if len(skipped) > 20:
            print(f"  ... and {len(skipped) - 20} more")
        print()

    # Show preview
    print(f"=== Preview of conversions (first 30) ===")
    for u in to_update[:30]:
        print(f"  {u['old_producer']} → {u['new_producer']}  ({u['name'][:40]})")
    if len(to_update) > 30:
        print(f"  ... and {len(to_update) - 30} more")
    print()

    if dry_run:
        print("DRY RUN complete. Use without --dry-run to apply changes.")
        return

    # Apply updates in batches of 50
    print("Applying updates...")
    batch_size = 50
    success = 0
    errors = 0

    for i in range(0, len(to_update), batch_size):
        batch = to_update[i:i+batch_size]
        updates = [{"id": u['id'], "producer": u['new_producer']} for u in batch]

        try:
            result = api_post("/api/beverages/bulk-update", {"updates": updates})
            batch_ok = result.get('updated', 0)
            batch_err = result.get('failed', 0)
            success += batch_ok
            errors += batch_err
            print(f"  Batch {i//batch_size + 1}: {batch_ok} updated, {batch_err} errors")
        except Exception as e:
            print(f"  Batch {i//batch_size + 1}: ERROR - {e}")
            errors += len(batch)

        time.sleep(0.5)

    # Also clear SKIP producers (set to empty)
    if skipped:
        print(f"\nClearing {len(skipped)} SKIP producers...")
        for i in range(0, len(skipped), batch_size):
            batch = skipped[i:i+batch_size]
            updates = [{"id": sid, "producer": ""} for sid, sp in batch]
            try:
                result = api_post("/api/beverages/bulk-update", {"updates": updates})
                batch_ok = result.get('updated', 0)
                print(f"  Batch: {batch_ok} cleared")
                success += batch_ok
            except Exception as e:
                print(f"  Batch: ERROR - {e}")
            time.sleep(0.5)

    print(f"\n=== DONE ===")
    print(f"Successfully updated: {success}")
    print(f"Errors: {errors}")

if __name__ == '__main__':
    main()
