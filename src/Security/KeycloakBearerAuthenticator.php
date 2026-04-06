<?php

namespace App\Security;

use App\Service\KeycloakHttp;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\InMemoryUser;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

/**
 * Valide le Bearer via l'endpoint Keycloak userinfo (HTTP natif, sans symfony/http-client).
 */
final class KeycloakBearerAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private string $keycloakBaseUrl,
        private string $realm,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        if (str_starts_with($request->getPathInfo(), '/api/auth')) {
            return false;
        }
        $auth = $request->headers->get('Authorization');
        return is_string($auth) && str_starts_with($auth, 'Bearer ');
    }

    public function authenticate(Request $request): Passport
    {
        $auth = (string) $request->headers->get('Authorization', '');
        $token = trim(substr($auth, strlen('Bearer ')));
        if ($token === '') {
            throw new AuthenticationException('Bearer token manquant');
        }

        $userinfoUrl = rtrim($this->keycloakBaseUrl, '/')
            . '/realms/' . rawurlencode($this->realm)
            . '/protocol/openid-connect/userinfo';

        try {
            /** @var array<string, mixed> $payload */
            $payload = $this->fetchKeycloakUserinfo($userinfoUrl, $token);
        } catch (\Throwable $e) {
            throw new AuthenticationException('Impossible de valider le token Keycloak', 0, $e);
        }

        $email = (string) ($payload['email'] ?? '');
        $username = (string) ($payload['preferred_username'] ?? $payload['sub'] ?? 'user');
        $identifier = $email !== '' ? $email : $username;

        return new SelfValidatingPassport(
            new UserBadge($identifier, function () use ($identifier) {
                return new InMemoryUser($identifier, null, ['ROLE_USER']);
            })
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchKeycloakUserinfo(string $url, string $accessToken): array
    {
        $res = KeycloakHttp::request('GET', $url, [
            'Authorization' => 'Bearer ' . $accessToken,
            'Accept' => 'application/json',
        ]);

        if ($res['status'] === 0 && $res['body'] === '') {
            throw new \RuntimeException('Keycloak userinfo injoignable (réseau ou Keycloak arrêté)');
        }

        if ($res['status'] < 200 || $res['status'] >= 300) {
            throw new \RuntimeException('Token invalide (userinfo HTTP ' . $res['status'] . ')');
        }

        $data = json_decode($res['body'], true);
        if (!is_array($data)) {
            throw new \RuntimeException('Réponse userinfo non JSON');
        }

        return $data;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'message' => 'Non authentifié',
            'error' => $exception->getMessage(),
        ], Response::HTTP_UNAUTHORIZED);
    }
}
