#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path


TEXT_CANDIDATES = ["text", "message", "content", "sentence", "post", "tweet"]
LABEL_CANDIDATES = ["label", "risk", "risk_label", "target", "class", "y"]


def pick_column(columns, preferred):
    lower = {c.lower(): c for c in columns}
    for name in preferred:
        if name in lower:
            return lower[name]
    return None


def normalize_label(value):
    raw = str(value).strip().lower()
    if raw in {"high", "2", "severe", "critical", "crisis"}:
        return "high"
    if raw in {"medium", "1", "moderate"}:
        return "medium"
    return "low"


def iter_csv_files(input_path: Path):
    if input_path.is_file() and input_path.suffix.lower() == ".csv":
        yield input_path
        return
    for file in input_path.rglob("*.csv"):
        yield file


def score_to_risk_label(anxiety, depression):
    """Map numeric screening scores to coarse risk labels for training."""
    try:
        a = float(anxiety)
        d = float(depression)
    except (TypeError, ValueError):
        return "low"
    # Rough bands aligned with common PHQ/GAD style severity (dataset-specific).
    if a >= 15 or d >= 15 or (a + d) >= 28:
        return "high"
    if a >= 8 or d >= 8 or (a + d) >= 14:
        return "medium"
    return "low"


def row_to_synthetic_text(row):
    """Turn tabular mental-health rows into a short text line for keyword training."""
    parts = []
    skip = {"Anxiety_Score", "Depression_Score"}
    for key, val in row.items():
        if key in skip:
            continue
        if val is None or str(val).strip() == "":
            continue
        token = str(val).strip().lower().replace(",", " ")
        parts.extend(token.split())
    try:
        parts.append(f"anxiety_{int(float(row.get('Anxiety_Score', 0)))}")
        parts.append(f"depression_{int(float(row.get('Depression_Score', 0)))}")
    except (TypeError, ValueError):
        pass
    return " ".join(parts)


def process_tabular_mental_health(reader):
    rows_out = []
    fields = reader.fieldnames or []
    lower = {c.lower(): c for c in fields}
    if "anxiety_score" not in lower or "depression_score" not in lower:
        return rows_out
    anx_col = lower["anxiety_score"]
    dep_col = lower["depression_score"]
    for row in reader:
        label = score_to_risk_label(row.get(anx_col), row.get(dep_col))
        text = row_to_synthetic_text(row)
        if text:
            rows_out.append({"text": text, "label": label})
    return rows_out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="CSV file or folder with CSV files")
    parser.add_argument("--output", required=True, help="Output normalized CSV path")
    parser.add_argument("--text-column", default="", help="Optional explicit text column")
    parser.add_argument("--label-column", default="", help="Optional explicit label column")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    rows_out = []
    for csv_file in iter_csv_files(input_path):
        with csv_file.open("r", encoding="utf-8", errors="ignore", newline="") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                continue
            text_col = args.text_column or pick_column(reader.fieldnames, TEXT_CANDIDATES)
            label_col = args.label_column or pick_column(reader.fieldnames, LABEL_CANDIDATES)
            if text_col and label_col:
                for row in reader:
                    text = str(row.get(text_col, "")).strip()
                    if not text:
                        continue
                    label = normalize_label(row.get(label_col, "low"))
                    rows_out.append({"text": text, "label": label})
                continue
            f.seek(0)
            reader = csv.DictReader(f)
            tabular_rows = process_tabular_mental_health(reader)
            rows_out.extend(tabular_rows)

    with output_path.open("w", encoding="utf-8", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"Wrote {len(rows_out)} rows to {output_path}")


if __name__ == "__main__":
    main()
