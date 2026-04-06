<?php

namespace App\Service;

/**
 * Création / suppression d’un utilisateur realm (patient + rôle) via l’API admin Keycloak.
 */
final class KeycloakPatientAdminService
{
    public function __construct(
        private string $keycloakBaseUrl,
        private string $realm,
        private string $adminUsername,
        private string $adminPassword,
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->adminUsername !== '' && $this->adminPassword !== '';
    }

    /**
     * @throws \RuntimeException
     */
    public function createPatientUser(
        string $username,
        string $email,
        string $firstName,
        string $lastName,
        string $password,
        ?string $birthDateYmd = null,
    ): string {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('Keycloak admin non configuré (KEYCLOAK_ADMIN_USERNAME / KEYCLOAK_ADMIN_PASSWORD).');
        }

        $adminToken = $this->fetchMasterAdminToken();
        $userId = $this->createUser($adminToken, $username, $email, $firstName, $lastName, $birthDateYmd);
        $this->setPassword($adminToken, $userId, $password);
        $this->assignRealmRolePatient($adminToken, $userId);

        return $userId;
    }

    public function deleteUser(string $keycloakUserId): void
    {
        if ($keycloakUserId === '' || !$this->isConfigured()) {
            return;
        }
        try {
            $adminToken = $this->fetchMasterAdminToken();
        } catch (\Throwable) {
            return;
        }
        $url = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm)
            . '/users/' . rawurlencode($keycloakUserId);
        KeycloakHttp::request('DELETE', $url, [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);
    }

    private function fetchMasterAdminToken(): string
    {
        $tokenUrl = rtrim($this->keycloakBaseUrl, '/')
            . '/realms/master/protocol/openid-connect/token';

        $body = http_build_query([
            'grant_type' => 'password',
            'client_id' => 'admin-cli',
            'username' => $this->adminUsername,
            'password' => $this->adminPassword,
        ]);

        $res = KeycloakHttp::request('POST', $tokenUrl, [
            'Content-Type' => 'application/x-www-form-urlencoded',
        ], $body);

        if ($res['status'] < 200 || $res['status'] >= 300) {
            $hint = self::keycloakBodyHint($res['body']);
            throw new \RuntimeException(
                'Keycloak admin token refusé (HTTP ' . $res['status'] . ')'
                . ($hint !== '' ? ' : ' . $hint : '')
                . ' — vérifiez KEYCLOAK_BASE_URL (sur Windows préférez http://127.0.0.1:8080), KEYCLOAK_ADMIN_USERNAME et KEYCLOAK_ADMIN_PASSWORD (realm master).'
            );
        }

        $data = json_decode($res['body'], true);
        if (!is_array($data) || empty($data['access_token'])) {
            $hint = self::keycloakBodyHint($res['body']);
            throw new \RuntimeException(
                'Token admin Keycloak absent dans la réponse' . ($hint !== '' ? ' : ' . $hint : '') . '.'
            );
        }

        return (string) $data['access_token'];
    }

    private function createUser(
        string $adminToken,
        string $username,
        string $email,
        string $firstName,
        string $lastName,
        ?string $birthDateYmd,
    ): string {
        $url = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm) . '/users';

        $body = [
            'username' => $username,
            'email' => $email,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'enabled' => true,
        ];
        if ($birthDateYmd !== null && $birthDateYmd !== '') {
            $body['attributes'] = ['birthdate' => [$birthDateYmd]];
        }

        $payload = json_encode($body, JSON_THROW_ON_ERROR);

        $res = KeycloakHttp::request('POST', $url, [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $adminToken,
        ], $payload);

        if ($res['status'] === 409) {
            throw new \RuntimeException('Cet identifiant existe déjà dans Keycloak.');
        }
        if ($res['status'] < 200 || $res['status'] >= 300) {
            $hint = self::keycloakBodyHint($res['body']);
            throw new \RuntimeException(
                'Keycloak création utilisateur échouée (HTTP ' . $res['status'] . ')'
                . ($hint !== '' ? ' : ' . $hint : '')
            );
        }

        return $this->findUserIdByUsername($adminToken, $username);
    }

    private function findUserIdByUsername(string $adminToken, string $username): string
    {
        $url = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm)
            . '/users?username=' . rawurlencode($username);

        $res = KeycloakHttp::request('GET', $url, [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);

        if ($res['status'] < 200 || $res['status'] >= 300) {
            throw new \RuntimeException('Keycloak: impossible de résoudre l’id utilisateur.');
        }

        $list = json_decode($res['body'], true);
        if (!is_array($list) || $list === [] || !isset($list[0]['id'])) {
            throw new \RuntimeException('Keycloak: utilisateur créé mais id introuvable.');
        }

        return (string) $list[0]['id'];
    }

    private function setPassword(string $adminToken, string $userId, string $password): void
    {
        $url = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm)
            . '/users/' . rawurlencode($userId) . '/reset-password';

        $payload = json_encode([
            'type' => 'password',
            'value' => $password,
            'temporary' => false,
        ], JSON_THROW_ON_ERROR);

        $res = KeycloakHttp::request('PUT', $url, [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $adminToken,
        ], $payload);

        if ($res['status'] < 200 || $res['status'] >= 300) {
            throw new \RuntimeException('Keycloak: définition du mot de passe échouée.');
        }
    }

    private function assignRealmRolePatient(string $adminToken, string $userId): void
    {
        $roleUrl = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm) . '/roles/patient';

        $res = KeycloakHttp::request('GET', $roleUrl, [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);

        if ($res['status'] < 200 || $res['status'] >= 300) {
            throw new \RuntimeException('Rôle « patient » introuvable dans Keycloak.');
        }

        $role = json_decode($res['body'], true);
        if (!is_array($role) || empty($role['id'])) {
            throw new \RuntimeException('Rôle « patient » introuvable dans Keycloak.');
        }

        $mapUrl = rtrim($this->keycloakBaseUrl, '/')
            . '/admin/realms/' . rawurlencode($this->realm)
            . '/users/' . rawurlencode($userId) . '/role-mappings/realm';

        // Représentation minimale (Keycloak 26+ est strict sur le JSON du POST).
        $payload = json_encode([[
            'id' => (string) $role['id'],
            'name' => (string) ($role['name'] ?? 'patient'),
        ]], JSON_THROW_ON_ERROR);
        $mapRes = KeycloakHttp::request('POST', $mapUrl, [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $adminToken,
        ], $payload);

        if ($mapRes['status'] < 200 || $mapRes['status'] >= 300) {
            $hint = self::keycloakBodyHint($mapRes['body']);
            $retryByNameOnly = $mapRes['status'] === 400
                && ($hint !== '' && str_contains(strtolower($hint), 'parse'));
            if ($retryByNameOnly) {
                $payload = json_encode([['name' => 'patient']], JSON_THROW_ON_ERROR);
                $mapRes = KeycloakHttp::request('POST', $mapUrl, [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $adminToken,
                ], $payload);
            }
        }

        if ($mapRes['status'] < 200 || $mapRes['status'] >= 300) {
            $hint = self::keycloakBodyHint($mapRes['body']);
            throw new \RuntimeException(
                'Keycloak: attribution du rôle patient échouée (HTTP ' . $mapRes['status'] . ')'
                . ($hint !== '' ? ' : ' . $hint : '')
            );
        }
    }

    private static function keycloakBodyHint(string $body): string
    {
        $body = trim($body);
        if ($body === '') {
            return '';
        }
        $decoded = json_decode($body, true);
        if (is_array($decoded)) {
            if (isset($decoded['error_description']) && is_string($decoded['error_description'])) {
                return mb_substr($decoded['error_description'], 0, 400);
            }
            if (isset($decoded['errorMessage']) && is_string($decoded['errorMessage'])) {
                return mb_substr($decoded['errorMessage'], 0, 400);
            }
            if (isset($decoded['error']) && is_string($decoded['error'])) {
                return mb_substr($decoded['error'], 0, 200);
            }
        }

        return mb_substr(preg_replace('/\s+/', ' ', $body) ?? $body, 0, 400);
    }
}
