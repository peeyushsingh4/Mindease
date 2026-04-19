#!/usr/bin/env python3
import argparse
import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path


def tokenize(text):
    tokens = []
    current = []
    for ch in text.lower():
      if "a" <= ch <= "z":
        current.append(ch)
      elif current:
        tokens.append("".join(current))
        current = []
    if current:
      tokens.append("".join(current))
    return tokens


def label_to_score(label):
    norm = str(label).strip().lower()
    if norm == "high":
        return 1.0
    if norm == "medium":
        return 0.6
    return 0.2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Prepared CSV with columns: text,label")
    parser.add_argument("--output", required=True, help="Output model json path")
    parser.add_argument("--max-keywords", type=int, default=60)
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    token_scores = defaultdict(float)
    token_counts = Counter()
    total_rows = 0

    with input_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = str(row.get("text", "")).strip()
            if not text:
                continue
            label_score = label_to_score(row.get("label", "low"))
            total_rows += 1
            seen = set(tokenize(text))
            for token in seen:
                if len(token) < 4:
                    continue
                token_scores[token] += label_score
                token_counts[token] += 1

    if total_rows == 0:
        raise SystemExit("No rows found in prepared dataset.")

    weighted = []
    for token, total in token_scores.items():
        count = token_counts[token]
        if count < 2:
            continue
        avg = total / count
        # Shrink frequent neutral words toward 0 by IDF-like term.
        idf = math.log((total_rows + 1) / (count + 1))
        score = max(0.0, min(1.0, avg * (idf / 4.0)))
        weighted.append((token, score))

    weighted.sort(key=lambda item: item[1], reverse=True)
    selected = weighted[: args.max_keywords]

    model = {
        "version": 1,
        "thresholdHigh": 0.75,
        "thresholdMedium": 0.45,
        "bias": 0.12,
        "keywordWeights": {token: round(score, 4) for token, score in selected},
        "screeningWeights": {
            "PHQ-9": {"base": 0.15, "scoreScale": 0.03},
            "GAD-7": {"base": 0.1, "scoreScale": 0.04},
        },
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as out:
        json.dump(model, out, indent=2)

    print(f"Saved model with {len(model['keywordWeights'])} keywords to {output_path}")


if __name__ == "__main__":
    main()
