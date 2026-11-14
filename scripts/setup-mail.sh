#!/usr/bin/env bash
# Private Hostinger mailbox setup without relying on PHP system().
set -euo pipefail
umask 077
if [[ ! -t 0 ]]; then printf 'Gebruik een interactieve SSH-terminal.\n' >&2; exit 1; fi
cd "$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
if [[ -e "../wattgoedkoper-private/mail-config.php" ]]; then
  printf 'STOP: mail is al ingesteld. Er wordt niets overschreven.\n' >&2; exit 1
fi
if ! read -rs -p 'Wachtwoord info@wattgoedkoper.nl (niet zichtbaar): ' mail_password; then
  printf '\nAfgebroken.\n' >&2; exit 1
fi
printf '\n' >&2
if [[ -z "$mail_password" ]]; then printf 'Afgebroken: leeg wachtwoord.\n' >&2; exit 1; fi
printf '%s\n' "$mail_password" | php scripts/setup-mail.php --piped-input
unset mail_password
