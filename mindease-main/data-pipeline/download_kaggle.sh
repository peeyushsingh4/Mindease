#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./download_kaggle.sh <kaggle-dataset-slug>"
  echo "Example: ./download_kaggle.sh rithurajnambiar/anxiety-and-depression-mental-health-dataset"
  exit 1
fi

DATASET_SLUG="$1"
SLUG_NAME="${DATASET_SLUG##*/}"
TARGET_DIR="data/raw/${SLUG_NAME}"

mkdir -p "${TARGET_DIR}"

echo "Downloading ${DATASET_SLUG} into ${TARGET_DIR}..."
kaggle datasets download -d "${DATASET_SLUG}" -p "${TARGET_DIR}" --unzip
echo "Done."
