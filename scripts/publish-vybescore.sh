#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVALS_DIR="${EVALS_DIR:-$ROOT_DIR/../doevals/evals}"

if [[ ! -d "$EVALS_DIR" ]]; then
  echo "EVALS_DIR does not exist: $EVALS_DIR" >&2
  echo "Set EVALS_DIR to the cloned acoliver/evals repository." >&2
  exit 1
fi

DEFAULT_CONFIGS="llxprt-cerebras-glm46,llxprt-synthetic-glm46,llxprt-synthetic-minimax,llxprt-zai-glm46"
CONFIG_LIST="${LLXPRT_CONFIGS:-$DEFAULT_CONFIGS}"
EXTRA_ARGS="${LLXPRT_EVAL_ARGS:-}"
SKIP_EVALS="${SKIP_EVALS:-0}"

IFS=',' read -ra CONFIG_ARRAY <<< "$CONFIG_LIST"
CONFIG_FLAGS=()
for CONFIG in "${CONFIG_ARRAY[@]}"; do
  CONFIG_TRIMMED="$(echo "$CONFIG" | xargs)"
  [[ -z "$CONFIG_TRIMMED" ]] && continue
  CONFIG_FLAGS+=("--config" "$CONFIG_TRIMMED")
done

if [[ "${#CONFIG_FLAGS[@]}" -eq 0 ]]; then
  echo "No configurations specified. Set LLXPRT_CONFIGS or leave blank for defaults." >&2
  exit 1
fi

pushd "$EVALS_DIR" >/dev/null

if [[ "$SKIP_EVALS" != "1" ]]; then
  echo "Running LLxprt evaluations for configs: ${CONFIG_FLAGS[*]}"
  npm run eval:all -- "${CONFIG_FLAGS[@]}" $EXTRA_ARGS
else
  echo "SKIP_EVALS=1 → skipping eval:all run."
fi

echo "Building VybeScore artifacts…"
npm run build:vybes

popd >/dev/null

echo "Syncing public artifacts into vybescore/"
rm -rf "$ROOT_DIR/vybescore"
mkdir -p "$ROOT_DIR/vybescore"
rsync -a --delete "$EVALS_DIR/public/" "$ROOT_DIR/vybescore/"

echo "Done. Review and commit vybescore/ changes when ready."
