#!/usr/bin/env python3
"""Build the urogyn.click redirect map from the catalogue.

Replaces the PHP redirector that ran on DreamHost. books.json already holds
every short_url and its destination, so the map is derived rather than
migrated: no DreamHost access is required to reproduce it.

The important property is that existing codes never change. Patients hold
printed QR codes encoding urogyn.click/<code>, and those must keep resolving
indefinitely. This script only ever adds codes, and refuses to reuse one.

Usage:
    python generate_map.py                  # write src/redirects.json
    python generate_map.py --check          # verify only, non-zero on drift
"""
from __future__ import annotations

import argparse
import json
import pathlib
import random
import sys

HERE = pathlib.Path(__file__).resolve().parent
BOOKS = HERE.parent / "src" / "libs" / "books.json"
OUT = HERE / "src" / "redirects.json"

SHORT_HOST = "urogyn.click"
# The charset the existing 483 codes use: base32 minus the characters that are
# ambiguous in print (0/O, 1/l/I). Kept identical so new codes are
# indistinguishable from old ones on a handout.
ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz"
CODE_LEN = 6


def code_of(short_url: str) -> str | None:
    if not short_url or SHORT_HOST not in short_url:
        return None
    return short_url.rstrip("/").rsplit("/", 1)[-1].lower()


def mint(existing: set[str], rng: random.Random) -> str:
    while True:
        c = "".join(rng.choice(ALPHABET) for _ in range(CODE_LEN))
        if c not in existing:
            existing.add(c)
            return c


def build(books: list[dict], allow_mint: bool) -> tuple[dict[str, str], list[str]]:
    mapping: dict[str, str] = {}
    minted: list[str] = []
    taken = {c for b in books if (c := code_of(b.get("short_url", "")))}
    rng = random.Random(20260807)

    for b in books:
        target = b.get("source")
        if not target:
            continue
        code = code_of(b.get("short_url", ""))
        if code is None:
            if not allow_mint:
                continue
            code = mint(taken, rng)
            minted.append(code)
            b["short_url"] = f"https://{SHORT_HOST}/{code}"
        if code in mapping and mapping[code] != target:
            raise SystemExit(f"collision: {code} maps to two targets")
        mapping[code] = target

    return mapping, minted


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="verify the committed map matches books.json")
    ap.add_argument("--mint", action="store_true",
                    help="allocate codes for catalogue entries that lack one")
    args = ap.parse_args()

    books = json.loads(BOOKS.read_text())
    mapping, minted = build(books, allow_mint=args.mint)

    if args.check:
        if not OUT.exists():
            print("redirects.json missing", file=sys.stderr)
            return 1
        current = json.loads(OUT.read_text())
        if current != mapping:
            only_new = set(mapping) - set(current)
            changed = {k for k in set(mapping) & set(current) if mapping[k] != current[k]}
            dropped = set(current) - set(mapping)
            print(f"drift: {len(only_new)} new, {len(changed)} retargeted, "
                  f"{len(dropped)} dropped", file=sys.stderr)
            if dropped:
                print("REFUSING: dropping a code breaks printed QR codes",
                      file=sys.stderr)
            return 1
        print(f"up to date: {len(mapping)} codes")
        return 0

    if OUT.exists():
        previous = json.loads(OUT.read_text())
        dropped = set(previous) - set(mapping)
        if dropped:
            raise SystemExit(
                f"refusing to drop {len(dropped)} existing codes "
                f"({sorted(dropped)[:5]}...): printed QR codes encode these"
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(mapping, indent=1, sort_keys=True) + "\n")
    if minted:
        BOOKS.write_text(json.dumps(books, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT.relative_to(HERE.parent)}: {len(mapping)} codes"
          + (f", {len(minted)} newly minted" if minted else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
