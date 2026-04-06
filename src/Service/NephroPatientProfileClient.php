<?php

namespace App\Service;

/**
 * Crée la ligne patient MySQL (dossier médical) via l’API Gateway → NEPHRO.
 */
final class NephroPatientProfileClient
{
    public function __construct(
        private string $gatewayBaseUrl,
    ) {
    }

    /**
     * @return int idPatient NEPHRO
     */
    public function registerProfile(string $username, string $email, string $firstName, string $lastName, ?string $birthDateYmd = null): int
    {
        $url = rtrim($this->gatewayBaseUrl, '/') . '/api/patients/register-profile';
        $body = [
            'username' => $username,
            'email' => $email,
            'firstName' => $firstName,
            'lastName' => $lastName,
        ];
        if ($birthDateYmd !== null && $birthDateYmd !== '') {
            $body['birthDate'] = $birthDateYmd;
        }
        $payload = json_encode($body, JSON_THROW_ON_ERROR);

        $res = KeycloakHttp::request('POST', $url, [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ], $payload);

        if ($res['status'] < 200 || $res['status'] >= 300) {
            throw new \RuntimeException(
                'NEPHRO (profil patient) : ' . ($res['body'] !== '' ? $res['body'] : 'HTTP ' . $res['status'])
            );
        }

        $data = json_decode($res['body'], true);
        $idPatient = is_array($data)
            ? ($data['idPatient'] ?? $data['idpatient'] ?? null)
            : null;
        if ($idPatient === null) {
            throw new \RuntimeException('NEPHRO : réponse register-profile invalide.');
        }

        return (int) $idPatient;
    }
}
