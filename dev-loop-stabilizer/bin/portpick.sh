#!/usr/bin/env bash
set -euo pipefail

preferred="${1:-}"
range_start="${2:-10000}"
range_end="${3:-20000}"

if [[ -z "$preferred" ]]; then
  echo "usage: $0 <preferred_port> [range_start] [range_end]" >&2
  exit 1
fi

is_free() {
  local port="$1"
  ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

if is_free "$preferred"; then
  echo "$preferred"
  exit 0
fi

for ((p=range_start; p<=range_end; p++)); do
  if [[ "$p" -eq "$preferred" ]]; then
    continue
  fi
  if is_free "$p"; then
    echo "$p"
    exit 0
  fi
done

echo "no free port found in range ${range_start}-${range_end}" >&2
exit 1
