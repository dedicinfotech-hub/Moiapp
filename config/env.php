<?php
/**
 * Minimal .env loader — reads config/.env into $_ENV and putenv().
 * Call loadEnv() once at the top of any entry point, or include this file.
 * Already-set environment variables (from the server) take precedence.
 */
function loadEnv(): void {
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;

    $file = __DIR__ . '/.env';
    if (!file_exists($file)) {
        $file = __DIR__ . '/.env.production';
    }
    if (!file_exists($file)) return;

    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        // Skip comments and blank lines
        if ($line === '' || str_starts_with($line, '#')) continue;

        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, '"\'');

        // Server env takes precedence (Hostinger can set vars via cPanel)
        if (!isset($_ENV[$key]) && getenv($key) === false) {
            $_ENV[$key]  = $value;
            putenv("{$key}={$value}");
        }
    }
}

loadEnv();

/**
 * Helper: get an env value with optional default.
 */
function env(string $key, string $default = ''): string {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

/**
 * Helper to normalize cover/upload URLs to the current APP_URL.
 */
function normalizeCoverUrl(?string $url): ?string {
    if (!$url) return null;
    $appUrl = rtrim(env('APP_URL', 'http://localhost:8888/MoiApp'), '/');
    if (preg_match('/uploads\/(.+)$/i', $url, $matches)) {
        return $appUrl . '/uploads/' . $matches[1];
    }
    return $url;
}
