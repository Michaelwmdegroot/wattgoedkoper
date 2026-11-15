#!/usr/bin/env bash
# Safe terminal prompts; never supply the recovery passphrase as CLI argument or in Git.
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-}"; path="${2:-}"; destination="${3:-}"
if [[ -z "$path" || "$path" != /* ]]; then
  printf 'Gebruik: bash scripts/backup-safe.sh create|inspect /ABSOLUUT/PAD.wgbk [LEGE_ISOLATIE_MAP]\n' >&2
  exit 2
fi
case "$mode" in
  create)
    arguments=(scripts/backup-create.php "--output=$path")
    if ! command -v mysqldump >/dev/null 2>&1 && command -v mariadb-dump >/dev/null 2>&1; then
      arguments+=(--dump-binary=mariadb-dump)
    fi
    ;;
  inspect) arguments=(scripts/backup-inspect.php "--file=$path") ;;
  extract)
    if [[ -z "$destination" || "$destination" != /* ]]; then
      printf 'Geef een absolute, lege herstelmap op een gescheiden host op.\n' >&2; exit 2
    fi
    arguments=(scripts/backup-inspect.php "--file=$path" "--extract-dir=$destination" --confirm-isolated)
    ;;
  *) printf 'Ongeldige modus. Gebruik create, inspect of extract.\n' >&2; exit 2 ;;
esac
read -r -s -p 'Herstelwachtzin (minimaal 20 tekens; geen weergave): ' passphrase
printf '\n' >&2
if [[ ${#passphrase} -lt 20 ]]; then printf 'Te korte wachtzin.\n' >&2; exit 2; fi
if [[ "$mode" == create ]]; then
  read -r -s -p 'Herstelwachtzin herhalen: ' again
  printf '\n' >&2
  if [[ "$passphrase" != "$again" ]]; then printf 'Wachtzinnen komen niet overeen.\n' >&2; exit 2; fi
  unset again
fi
printf '%s\n' "$passphrase" | php "${arguments[@]}"
unset passphrase
