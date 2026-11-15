<?php
declare(strict_types=1);
/** Encrypted, authenticated, chunked WattGoedkoper recovery bundle. No plaintext dump on disk. */
const WG_BACKUP_MAGIC = "WGBK1\0";

function wg_backup_require_crypto(): void {
    if (!extension_loaded('sodium') || !function_exists('sodium_crypto_secretstream_xchacha20poly1305_init_push')) {
        throw new RuntimeException('De PHP-extensie sodium is nodig voor veilige back-ups.');
    }
}
function wg_backup_key(string $passphrase, string $salt): string {
    wg_backup_require_crypto();
    if (strlen($passphrase) < 20) {
        throw new RuntimeException('Gebruik een herstelwachtzin van ten minste 20 tekens.');
    }
    return sodium_crypto_pwhash(
        SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES,
        $passphrase, $salt,
        SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE,
        SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE,
        SODIUM_CRYPTO_PWHASH_ALG_ARGON2ID13
    );
}
function wg_backup_write_all($stream, string $bytes): void {
    $offset = 0;
    while ($offset < strlen($bytes)) {
        $n = fwrite($stream, substr($bytes, $offset));
        if (!is_int($n) || $n === 0) throw new RuntimeException('Back-up schrijven mislukt.');
        $offset += $n;
    }
}
function wg_backup_read_exact($stream, int $length): string {
    $result = '';
    while (strlen($result) < $length) {
        $piece = fread($stream, $length - strlen($result));
        if ($piece === false || $piece === '') throw new RuntimeException('Back-up is onvolledig.');
        $result .= $piece;
    }
    return $result;
}
/** Returns a secretstream state; pass by reference to subsequent record writes. */
function wg_backup_begin($stream, string $passphrase): string {
    $salt = random_bytes(SODIUM_CRYPTO_PWHASH_SALTBYTES);
    $key = wg_backup_key($passphrase, $salt);
    [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($key);
    sodium_memzero($key);
    wg_backup_write_all($stream, WG_BACKUP_MAGIC . $salt . $header);
    return $state;
}
/** Record types: T metadata, C private config, M private mail config, S SQL data, E final. */
function wg_backup_record($stream, string &$state, string $type, string $data, bool $last = false): void {
    if (!in_array($type, ['T', 'C', 'M', 'S', 'E'], true) || strlen($data) > 65536) {
        throw new InvalidArgumentException('Ongeldig back-uprecord.');
    }
    $tag = $last ? SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL
                 : SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE;
    $cipher = sodium_crypto_secretstream_xchacha20poly1305_push($state, $type . $data, '', $tag);
    wg_backup_write_all($stream, pack('N', strlen($cipher)) . $cipher);
}
/** Authenticates the *complete* archive; handler receives decrypted chunks only in memory. */
function wg_backup_read(string $path, string $passphrase, callable $handle): array {
    wg_backup_require_crypto();
    $stream = @fopen($path, 'rb');
    if (!$stream) throw new RuntimeException('Back-upbestand niet leesbaar.');
    try {
        if (wg_backup_read_exact($stream, strlen(WG_BACKUP_MAGIC)) !== WG_BACKUP_MAGIC) {
            throw new RuntimeException('Onbekend back-upformaat.');
        }
        $salt = wg_backup_read_exact($stream, SODIUM_CRYPTO_PWHASH_SALTBYTES);
        $header = wg_backup_read_exact($stream, SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_HEADERBYTES);
        $key = wg_backup_key($passphrase, $salt);
        $state = sodium_crypto_secretstream_xchacha20poly1305_init_pull($header, $key);
        sodium_memzero($key);
        $phase = 0; $meta = null; $mail = false; $sqlBytes = 0; $chunks = 0;
        while (true) {
            $prefix = fread($stream, 4);
            if ($prefix === '' || $prefix === false) throw new RuntimeException('Eindmarkering ontbreekt.');
            if (strlen($prefix) !== 4) throw new RuntimeException('Back-uprecord afgebroken.');
            $size = unpack('Nsize', $prefix)['size'];
            if ($size < 18 || $size > 70000) throw new RuntimeException('Ongeldige back-uprecordlengte.');
            $decoded = sodium_crypto_secretstream_xchacha20poly1305_pull(
                $state, wg_backup_read_exact($stream, $size)
            );
            if ($decoded === false) throw new RuntimeException('Back-upauthenticatie mislukt (wachtzin of inhoud).');
            [$plain, $tag] = $decoded;
            $type = substr($plain, 0, 1); $data = substr($plain, 1);
            if ($type === 'T' && $phase === 0 && $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE) {
                $meta = json_decode($data, true, 8, JSON_THROW_ON_ERROR);
                if (!is_array($meta) || ($meta['format'] ?? '') !== 'wg-mysql-v1') throw new RuntimeException('Ongeldige metadata.');
                $phase = 1;
            } elseif ($type === 'C' && $phase === 1 && $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE && $data !== '') {
                $phase = 2;
            } elseif ($type === 'M' && $phase === 2 && !$mail && $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE && $data !== '') {
                $mail = true;
            } elseif ($type === 'S' && $phase >= 2 && $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE) {
                $phase = 3; $sqlBytes += strlen($data); $chunks++;
            } elseif ($type === 'E' && $phase === 3 && $data === '' && $sqlBytes > 0
                && $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL) {
                if (fgetc($stream) !== false) throw new RuntimeException('Extra gegevens na einde back-up.');
                $handle($type, $data);
                return ['format'=>'wg-mysql-v1', 'createdAt'=>$meta['createdAt'] ?? null,
                    'sqlBytes'=>$sqlBytes, 'sqlChunks'=>$chunks, 'configIncluded'=>true,
                    'mailConfigIncluded'=>$mail, 'authenticated'=>true];
            } else {
                throw new RuntimeException('Ongeldige back-uprecordvolgorde of eindmarkering.');
            }
            $handle($type, $data);
        }
    } finally { fclose($stream); }
}
/** Reject webroot, public ancestor paths, symlinks and group/world-readable destinations. */
function wg_backup_safe_directory(string $directory, string $webroot): string {
    if (!str_starts_with($directory, '/') || is_link($directory)) throw new RuntimeException('Gebruik een echte absolute privémap.');
    $real = realpath($directory); $root = realpath($webroot);
    if (!$real || !$root || !is_dir($real) || $real === '/' || $real === $root
        || str_starts_with($real, $root . '/') || str_starts_with($root, $real . '/')) {
        throw new RuntimeException('De back-upmap mag niet in of boven de webroot liggen.');
    }
    $mode = @fileperms($real);
    if ($mode === false || (($mode & 0077) !== 0)) {
        throw new RuntimeException('Back-upmap moet uitsluitend voor de eigenaar toegankelijk zijn (chmod 700).');
    }
    return $real;
}

/**
 * Avoid accidental extraction on this host while a production installation
 * exists. Inspect the standard sibling private directory even when an
 * arbitrary WG_PRIVATE_DIR environment override was supplied.
 */
function wg_backup_installed_here(string $siteRoot, string $configuredPrivate): bool {
    $candidatePaths=[
        rtrim($configuredPrivate, '/') . '/config.php',
        rtrim(dirname($siteRoot), '/') . '/wattgoedkoper-private/config.php'
    ];
    foreach (array_unique($candidatePaths) as $path) {
        if (is_file($path)) return true;
    }
    return false;
}
