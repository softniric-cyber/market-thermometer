#!/usr/bin/env python3
"""
Generate monthly market report JSON from metrics.json.

Usage:
    python scripts/generate-report.py              # current month
    python scripts/generate-report.py 2026-03      # specific month

Output: content/reports/YYYY-MM.json
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
METRICS = ROOT / "public" / "metrics.json"
REPORTS_DIR = ROOT / "content" / "reports"


def pct_change(current: float, previous: float | None) -> float | None:
    if previous is None or previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


def week_to_month(week_label: str) -> tuple[int, int]:
    """Convert ISO week '2026-14' → (year, month) using week_start date."""
    # We'll map later using week_start field
    pass


def build_report(metrics: dict, target_year: int, target_month: int) -> dict:
    zones = metrics["zones"]
    trends_market = metrics["trends"]["market"]
    trends_district = metrics["trends"]["by_district"]

    # --- Find current and previous month's weekly data ---
    # Weeks are labelled as "2026-WW". Map each to its month via week_start.
    def week_month(entry: dict) -> tuple[int, int]:
        ws = entry.get("week_start", "")
        if ws:
            d = datetime.strptime(ws, "%Y-%m-%d")
            return (d.year, d.month)
        return (0, 0)

    # Aggregate market-level by month
    month_data: dict[tuple[int, int], list] = {}
    for entry in trends_market:
        ym = week_month(entry)
        month_data.setdefault(ym, []).append(entry)

    target = (target_year, target_month)
    prev_m = target_month - 1 if target_month > 1 else 12
    prev_y = target_year if target_month > 1 else target_year - 1
    prev = (prev_y, prev_m)

    # Current month avg
    cur_entries = month_data.get(target, [])
    if not cur_entries:
        # Fall back: use the latest available data
        print(f"⚠ No data for {target_year}-{target_month:02d}, using latest available")
        if month_data:
            target = max(month_data.keys())
            cur_entries = month_data[target]
            target_year, target_month = target
        else:
            raise ValueError("No trend data available")

    avg_sqm = round(sum(e["avg_sqm"] for e in cur_entries) / len(cur_entries))
    total_listings = max(e.get("n_listings", 0) for e in cur_entries)

    # Previous month avg
    prev_entries = month_data.get(prev, [])
    prev_avg_sqm = (
        round(sum(e["avg_sqm"] for e in prev_entries) / len(prev_entries))
        if prev_entries
        else None
    )

    # --- District-level aggregation ---
    district_month: dict[tuple[int, int], dict[str, list]] = {}
    for entry in trends_district:
        ym = week_month(entry)
        d_name = entry.get("distrito", "")
        district_month.setdefault(ym, {}).setdefault(d_name, []).append(entry)

    cur_districts_raw = district_month.get(target, {})
    prev_districts_raw = district_month.get(prev, {})

    districts = []
    for zone in zones:
        name = zone["name"]
        cur_d = cur_districts_raw.get(name, [])
        prev_d = prev_districts_raw.get(name, [])

        cur_sqm = (
            round(sum(e["avg_sqm"] for e in cur_d) / len(cur_d)) if cur_d else zone.get("price_per_sqm", 0)
        )
        prev_sqm = (
            round(sum(e["avg_sqm"] for e in prev_d) / len(prev_d)) if prev_d else None
        )

        districts.append({
            "name": name,
            "price_per_sqm": cur_sqm,
            "prev_price_per_sqm": prev_sqm,
            "change_pct": pct_change(cur_sqm, prev_sqm),
            "median_price": zone.get("median_price"),
            "active_count": zone.get("active_count", 0),
            "days_to_sell": zone.get("days_to_sell"),
        })

    # --- Highlights ---
    with_change = [d for d in districts if d["change_pct"] is not None]
    by_change = sorted(with_change, key=lambda d: d["change_pct"] or 0, reverse=True)
    by_price = sorted(districts, key=lambda d: d["price_per_sqm"], reverse=True)
    by_days = sorted(
        [d for d in districts if d["days_to_sell"] is not None],
        key=lambda d: d["days_to_sell"],
    )

    slug = f"{target_year}-{target_month:02d}"

    return {
        "slug": slug,
        "year": target_year,
        "month": target_month,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "avg_sqm": avg_sqm,
        "prev_avg_sqm": prev_avg_sqm,
        "market_change_pct": pct_change(avg_sqm, prev_avg_sqm),
        "total_listings": total_listings,
        "districts": sorted(districts, key=lambda d: d["price_per_sqm"], reverse=True),
        "top_risers": by_change[:3] if by_change else [],
        "top_fallers": by_change[-3:][::-1] if len(by_change) >= 3 else [],
        "most_expensive": by_price[0] if by_price else districts[0],
        "cheapest": by_price[-1] if by_price else districts[-1],
        "fastest_selling": by_days[0] if by_days else districts[0],
        "slowest_selling": by_days[-1] if by_days else districts[-1],
    }


def main():
    if not METRICS.exists():
        print(f"✗ {METRICS} not found")
        sys.exit(1)

    metrics = json.loads(METRICS.read_text())

    # Parse target month
    if len(sys.argv) > 1:
        parts = sys.argv[1].split("-")
        target_year, target_month = int(parts[0]), int(parts[1])
    else:
        now = datetime.now()
        target_year, target_month = now.year, now.month

    report = build_report(metrics, target_year, target_month)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out = REPORTS_DIR / f"{report['slug']}.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"✓ Report written to {out}")
    print(f"  Market avg: {report['avg_sqm']} €/m² ({report['market_change_pct'] or '—'}% MoM)")
    print(f"  Top riser:  {report['top_risers'][0]['name']} ({report['top_risers'][0]['change_pct']}%)" if report['top_risers'] else "")
    print(f"  Districts:  {len(report['districts'])}")


if __name__ == "__main__":
    main()
