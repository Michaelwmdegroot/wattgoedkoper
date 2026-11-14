#!/usr/bin/env bash
# Safe Hostinger setup: Bash prompts for secrets without echo.
# Passwords go through a pipe, never through command-line arguments or exported environment variables.
set -euo pipefail
umask 077
if [[ ! -t 0 ]]; then
  printf 'Start deze installatie in een interactieve SSH-terminal.\n' >&2
  exit 1
fi
root="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
cd "$root"
if [[ -e "../wattgoedkoper-private/config.php" ]]; then
  printf 'STOP: er bestaat al een serverconfiguratie. Niets wordt overschreven.\n' >&2
  exit 1
fi
admin_username="beheerder"
if [[ "$#" -gt 0 ]]; then admin_username="$1"; fi
printf 'WattGoedkoper — beveiligde MySQL-installatie\n' >&2
printf 'Gebruik uitsluitend de nieuwe database onder wattgoedkoper.nl.\n' >&2
if ! read -r -p 'MySQL databasenaam: ' db_name; then
  printf '\nAfgebroken: geen invoer.\n' >&2; exit 1
fi
if ! read -r -p 'MySQL gebruikersnaam: ' db_user; then
  printf '\nAfgebroken: geen invoer.\n' >&2; exit 1
fi
if ! read -rs -p 'MySQL wachtwoord (niet zichtbaar): ' db_password; then
  printf '\nAfgebroken: geen wachtwoord ingevoerd.\n' >&2; exit 1
fi
printf '\n' >&2
if [[ -z "$db_password" ]]; then
  printf 'Afgebroken: leeg MySQL-wachtwoord.\n' >&2; exit 1
fi
if ! read -rs -p 'Nieuw beheerwachtwoord (minimaal 14 tekens, niet zichtbaar): ' admin_password; then
  printf '\nAfgebroken: geen beheerwachtwoord ingevoerd.\n' >&2; exit 1
fi
printf '\n' >&2
# The printf is a Bash builtin. Secrets never enter argv, shell history or exported environment.
printf '%s\n%s\n%s\n%s\n' "$db_name" "$db_user" "$db_password" "$admin_password" |
  php scripts/setup-mysql.php --piped-input --origin=https://wattgoedkoper.nl --username="$admin_username"
unset db_name db_user db_password admin_password
