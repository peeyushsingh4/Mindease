# Kaggle Data Pipeline (MindEase)

This folder adds a practical workflow to use Kaggle data for risk scoring:

1. Download a dataset from Kaggle
2. Prepare into a normalized CSV with `text` and `label` columns
3. Train a lightweight model and export weights
4. Use exported model in backend runtime scoring

## 1) Download Dataset

Install Kaggle CLI and authenticate (`~/.kaggle/kaggle.json`), then run:

```bash
cd data-pipeline
./download_kaggle.sh "ak0212/anxiety-and-depression-mental-health-factors"
```

This creates `data/raw/<dataset-slug>/`. If you see **403 Forbidden**, the slug is wrong, the dataset was removed, or you must accept dataset rules on the Kaggle website first.

## 2) Prepare Data

```bash
cd data-pipeline
python3 prepare_dataset.py --input "data/raw/anxiety-and-depression-mental-health-factors" --output "data/processed/training.csv"
```

Tabular CSVs with `Anxiety_Score` and `Depression_Score` (no free-text column) are converted automatically into synthetic text + risk labels.

The script tries to detect columns. You can also pass explicit names:

```bash
python3 prepare_dataset.py \
  --input "data/raw/<slug>" \
  --text-column "text" \
  --label-column "risk_label" \
  --output "data/processed/training.csv"
```

## 3) Train Model

```bash
cd data-pipeline
python3 train_risk_model.py --input "data/processed/training.csv" --output "../backend/data/risk-model.json"
```

## 4) Use in Backend

No extra step needed after export. Backend reads:

- `backend/data/risk-model.json`

If missing, backend safely falls back to default heuristic weights.

---

Notes:
- Expected labels can be: `low`, `medium`, `high` (or numeric 0/1/2).
- Keep human-reviewed safety rules active for explicit self-harm intent.
