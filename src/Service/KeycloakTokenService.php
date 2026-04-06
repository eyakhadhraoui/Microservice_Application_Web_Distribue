<?php

namespace App\Service;

/**
 * Resource Owner Password (direct access grants) vers Keycloak.
 */
final class KeycloakTokenService
{
    public function __construct(
        private string $keycloakBaseUrl,
        private string $realm,
        private string $clientId,
        private string $clientSecret,
    ) {
    }

    /**
     * @return array<string, mixed> corps JSON du token endpoint (access_token, etc.)
     */
    public function loginWithPassword(string $username, string $password): array
    {
        $tokenUrl = rtrim($this->keycloakBaseUrl, '/')
            . '/realms/' . rawurlencode($this->realm)
            . '/protocol/openid-connect/token';

        $fields = [
            'grant_type' => 'password',
            'client_id' => $this->clientId,
            'username' => $username,
            'password' => $password,
        ];
        if ($this->clientSecret !== '') {
            $fields['client_secret'] = $this->clientSecret;
        }

        $res = KeycloakHttp::request('POST', $tokenUrl, [
            'Content-Type' => 'application/x-www-form-urlencoded',
        ], http_build_query($fields));

        if ($res['status'] >= 200 && $res['status'] < 300) {
            $data = json_decode($res['body'], true);
            if (is_array($data) && isset($data['access_token'])) {
                return $data;
            }
            throw new \RuntimeException('Réponse token invalide');
        }

        $this->throwLoginFailure($res['status'], $res['body']);
    }

    private function throwLoginFailure(int $status, string $body): void
    {
        if ($status === 401) {
            throw new \RuntimeException('Identifiant ou mot de passe incorrect');
        }
        if ($status === 400 && (str_contains($body, 'unauthorized_client') || str_contains($body, 'Direct access'))) {
            throw new \RuntimeException('Keycloak : activez « Direct access grants » pour le client ' . $this->clientId);
        }
        if ($status === 400 && (str_contains($body, 'invalid_grant') || str_contains($body, 'Invalid user credentials'))) {
            throw new \RuntimeException('Identifiant ou mot de passe incorrect');
        }
        $msg = trim($body) !== '' ? $body : 'Erreur Keycloak (HTTP ' . $status . ')';
        throw new \RuntimeException($msg);
    }
}
