#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RESET=false
ASSUME_YES=false
BUILD=true
TELEMETRY=true
TIMEOUT=180

usage() {
  printf '%s\n' "Usage: ./start.sh [--reset] [--yes] [--no-build] [--no-telemetry] [--timeout SECONDS]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset) RESET=true ;;
    --yes) ASSUME_YES=true ;;
    --no-build) BUILD=false ;;
    --no-telemetry) TELEMETRY=false ;;
    --timeout)
      shift
      [[ ${1:-} =~ ^[0-9]+$ ]] || { printf '%s\n' "--timeout requires a positive number of seconds." >&2; exit 2; }
      TIMEOUT="$1"
      ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

command -v docker >/dev/null 2>&1 || { printf '%s\n' "Docker is required. Install Docker Desktop or Docker Engine, then rerun ./start.sh." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { printf '%s\n' "The Docker Compose plugin is required (docker compose)." >&2; exit 1; }
docker info >/dev/null 2>&1 || { printf '%s\n' "The Docker daemon is not running. Start Docker and rerun ./start.sh." >&2; exit 1; }
docker compose config --quiet

APP_PORT="${APP_PORT:-3001}"
export APP_PORT
export PUBLIC_APP_ORIGIN="${PUBLIC_APP_ORIGIN:-http://localhost:${APP_PORT}}"

diagnostics() {
  local status=$?
  if [[ $status -ne 0 ]]; then
    printf '\n%s\n' "Honey Chain did not become ready. Current service state:"
    docker compose ps --all || true
    printf '\n%s\n' "Recent initialization and application logs:"
    docker compose logs --no-color --tail 80 db migrate app || true
  fi
  exit "$status"
}
trap diagnostics ERR

if [[ "$RESET" == true ]]; then
  if [[ "$ASSUME_YES" != true ]]; then
    [[ -t 0 ]] || { printf '%s\n' "--reset requires --yes in non-interactive use." >&2; exit 2; }
    printf '%s' "Reset only the honey-chain-demo containers and database volume? [y/N] "
    read -r answer
    [[ "$answer" =~ ^[Yy]$ ]] || { printf '%s\n' "Reset cancelled."; exit 0; }
  fi
  docker compose down --volumes --remove-orphans
fi

up_args=(up --detach --wait --wait-timeout "$TIMEOUT")
if [[ "$BUILD" == true ]]; then up_args+=(--build); fi
docker compose "${up_args[@]}"

if [[ "$TELEMETRY" == true ]]; then
  docker compose run --rm telemetry
fi

trap - ERR
printf '\n%s\n' "Honey Chain presentation demo is ready."
printf '  Application:  %s\n' "$PUBLIC_APP_ORIGIN"
printf '  Health:       %s/api/health\n' "$PUBLIC_APP_ORIGIN"
printf '  Verify:       %s/verify?trace=HC-BK102-B260906-03-000347\n' "$PUBLIC_APP_ORIGIN"
printf '  QR image:     %s/api/qr/HC-BK102-B260906-03-000347\n' "$PUBLIC_APP_ORIGIN"
printf '  QR labels:    %s/labels?batch=HC-BK102-B260906-03\n' "$PUBLIC_APP_ORIGIN"
printf '\n%s\n' "Demo password for all listed accounts: honey123"
printf '%s\n' "Use ./start.sh again to preserve state, or ./start.sh --reset for a confirmed clean reset."
