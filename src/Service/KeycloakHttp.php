<?php

namespace App\Service;

/**
 * Appels HTTP vers Keycloak : préfère cURL si disponible (Windows / allow_url_fopen),
 * sinon file_get_contents. Normalise localhost → 127.0.0.1 pour éviter IPv6 (::1).
 *
 * @internal
 */
final class KeycloakHttp
{
    /**
     * @param array<string, string> $headers
     * @return array{status:int, body:string}
     */
    public static function request(string $method, string $url, array $headers = [], ?string $body = null): array
    {
        $url = self::normalizeLocalhostUrl($url);
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $insecureRaw = getenv('KEYCLOAK_HTTP_INSECURE');
        if ($insecureRaw === false || $insecureRaw === '') {
            $insecureRaw = $_ENV['KEYCLOAK_HTTP_INSECURE'] ?? '0';
        }
        $insecure = filter_var($insecureRaw, FILTER_VALIDATE_BOOLEAN);
        $verifySsl = ($scheme === 'https') && !$insecure;

        if (extension_loaded('curl')) {
            return self::requestCurl($method, $url, $headers, $body, $verifySsl);
        }

        return self::requestStream($method, $url, $headers, $body, $verifySsl);
    }

    private static function normalizeLocalhostUrl(string $url): string
    {
        $p = parse_url($url);
        if ($p === false || !isset($p['host']) || strcasecmp($p['host'], 'localhost') !== 0) {
            return $url;
        }
        $p['host'] = '127.0.0.1';
        $scheme = ($p['scheme'] ?? 'http') . '://';
        $auth = isset($p['user'])
            ? $p['user'] . (isset($p['pass']) ? ':' . $p['pass'] : '') . '@'
            : '';
        $host = $p['host'];
        $port = isset($p['port']) ? ':' . $p['port'] : '';
        $path = ($p['path'] ?? '') ?: '';
        $query = isset($p['query']) ? '?' . $p['query'] : '';
        $fragment = isset($p['fragment']) ? '#' . $p['fragment'] : '';

        return $scheme . $auth . $host . $port . $path . $query . $fragment;
    }

    /**
     * @param array<string, string> $headers
     * @return array{status:int, body:string}
     */
    private static function requestCurl(
        string $method,
        string $url,
        array $headers,
        ?string $body,
        bool $verifySsl,
    ): array {
        $ch = curl_init($url);
        if ($ch === false) {
            return ['status' => 0, 'body' => ''];
        }

        $headerLines = [];
        foreach ($headers as $k => $v) {
            $headerLines[] = $k . ': ' . $v;
        }

        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_SSL_VERIFYPEER => $verifySsl,
            CURLOPT_SSL_VERIFYHOST => $verifySsl ? 2 : 0,
        ];
        if ($body !== null && $body !== '') {
            $opts[CURLOPT_POSTFIELDS] = $body;
        }

        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            return [
                'status' => $status > 0 ? $status : 0,
                'body' => $err !== '' ? $err : '',
            ];
        }

        return ['status' => $status, 'body' => (string) $raw];
    }

    /**
     * @param array<string, string> $headers
     * @return array{status:int, body:string}
     */
    private static function requestStream(
        string $method,
        string $url,
        array $headers,
        ?string $body,
        bool $verifySsl,
    ): array {
        $lines = [];
        foreach ($headers as $k => $v) {
            $lines[] = $k . ': ' . $v;
        }

        $opts = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $lines),
                'timeout' => 45,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => $verifySsl,
                'verify_peer_name' => $verifySsl,
            ],
        ];
        if ($body !== null && $body !== '') {
            $opts['http']['content'] = $body;
        }

        $ctx = stream_context_create($opts);
        $raw = @file_get_contents($url, false, $ctx);
        $status = 0;
        if (isset($http_response_header) && isset($http_response_header[0])
            && preg_match('/HTTP\/\S+\s+(\d{3})/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }

        return [
            'status' => $status,
            'body' => $raw === false ? '' : $raw,
        ];
    }
}
