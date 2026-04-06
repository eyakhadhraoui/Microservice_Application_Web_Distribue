<?php

namespace App\Controller;

use App\Service\KeycloakPatientAdminService;
use App\Service\KeycloakTokenService;
use App\Service\NephroPatientProfileClient;
use App\Service\UserService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private KeycloakTokenService $keycloakTokenService,
        private KeycloakPatientAdminService $keycloakPatientAdminService,
        private UserService $userService,
        private NephroPatientProfileClient $nephroPatientProfileClient,
    ) {
    }

    #[Route('/ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'message' => 'User-service (Symfony) — auth centralisée',
        ]);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Corps JSON invalide'], Response::HTTP_BAD_REQUEST);
        }
        $username = isset($data['username']) ? trim((string) $data['username']) : '';
        $password = isset($data['password']) ? (string) $data['password'] : '';
        if ($username === '' || $password === '') {
            return $this->json(['message' => 'Username et mot de passe requis'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $token = $this->keycloakTokenService->loginWithPassword($username, $password);

            return new JsonResponse($token);
        } catch (\Throwable $e) {
            $msg = trim((string) $e->getMessage()) !== '' ? $e->getMessage() : 'Erreur de connexion';
            $unauthorized = str_contains($msg, 'incorrect')
                || str_contains($msg, 'invalid_grant')
                || str_contains($msg, 'Invalid user credentials');
            $status = $unauthorized ? Response::HTTP_UNAUTHORIZED : Response::HTTP_SERVICE_UNAVAILABLE;
            if (str_contains($msg, 'HTTP 0') || str_contains($msg, 'Failed to open stream') || str_contains($msg, 'allow_url_fopen')) {
                $status = Response::HTTP_SERVICE_UNAVAILABLE;
                $kcUrl = getenv('KEYCLOAK_BASE_URL') ?: ($_ENV['KEYCLOAK_BASE_URL'] ?? 'http://127.0.0.1:8080');
                $msg = 'Keycloak injoignable depuis PHP (vérifiez Keycloak sur ' . $kcUrl . ', essayez 127.0.0.1 au lieu de localhost sous Windows, et allow_url_fopen=On).';
            }

            $payload = ['message' => $msg, 'source' => $unauthorized ? 'auth' : 'keycloak'];
            if (($_ENV['APP_ENV'] ?? 'prod') === 'dev') {
                $payload['error'] = $e::class;
                $payload['location'] = basename($e->getFile()) . ':' . $e->getLine();
            }

            return $this->json($payload, $status);
        }
    }

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            return $this->doRegister($request);
        } catch (\Throwable $e) {
            $payload = [
                'message' => 'Erreur inattendue à l’inscription. Consultez var/log/dev.log et la réponse détaillée en mode dev.',
            ];
            if (($_ENV['APP_ENV'] ?? 'prod') === 'dev') {
                $payload['error'] = $e::class;
                $payload['detail'] = $e->getMessage();
                $payload['location'] = basename($e->getFile()) . ':' . $e->getLine();
            }

            return $this->json($payload, Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function doRegister(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Corps JSON invalide'], Response::HTTP_BAD_REQUEST);
        }

        $username = isset($data['username']) ? trim((string) $data['username']) : '';
        $email = isset($data['email']) ? trim((string) $data['email']) : '';
        $firstName = isset($data['firstName']) ? trim((string) $data['firstName']) : '';
        $lastName = isset($data['lastName']) ? trim((string) $data['lastName']) : '';
        $password = isset($data['password']) ? (string) $data['password'] : '';
        $birthRaw = isset($data['birthDate']) ? trim((string) $data['birthDate']) : '';

        if ($username === '' || $email === '' || $firstName === '' || $lastName === '' || $password === '' || $birthRaw === '') {
            return $this->json(['message' => 'Tous les champs sont requis (username, email, prénom, nom, date de naissance, mot de passe).'], Response::HTTP_BAD_REQUEST);
        }

        $birthDt = \DateTimeImmutable::createFromFormat('Y-m-d', $birthRaw);
        if ($birthDt === false || $birthDt->format('Y-m-d') !== $birthRaw) {
            return $this->json(['message' => 'Date de naissance invalide (format AAAA-MM-JJ).'], Response::HTTP_BAD_REQUEST);
        }

        $keycloakId = null;

        try {
            $keycloakId = $this->keycloakPatientAdminService->createPatientUser(
                $username,
                $email,
                $firstName,
                $lastName,
                $password,
                $birthRaw
            );
        } catch (\Throwable $e) {
            $msg = trim((string) $e->getMessage()) !== ''
                ? $e->getMessage()
                : 'Keycloak injoignable ou erreur admin — vérifiez que Keycloak tourne, KEYCLOAK_* et les droits admin API.';
            if (str_contains($msg, 'HTTP 0') || str_contains($msg, 'Failed to open stream') || str_contains($msg, 'allow_url_fopen')) {
                $kcUrl = getenv('KEYCLOAK_BASE_URL') ?: ($_ENV['KEYCLOAK_BASE_URL'] ?? 'http://127.0.0.1:8080');
                $msg = 'Keycloak injoignable depuis PHP (vérifiez Keycloak sur ' . $kcUrl . ', essayez 127.0.0.1 au lieu de localhost sous Windows, et allow_url_fopen=On).';
            }
            $payload = [
                'message' => $msg,
                'source' => 'keycloak',
                'hint' => 'Démarrez Keycloak ; vérifiez KEYCLOAK_BASE_URL (ex. http://127.0.0.1:8080), KEYCLOAK_REALM, KEYCLOAK_ADMIN_USERNAME/PASSWORD (realm master), et le rôle realm « patient ».',
            ];
            if (($_ENV['APP_ENV'] ?? 'prod') === 'dev') {
                $payload['error'] = $e::class;
                $payload['location'] = basename($e->getFile()) . ':' . $e->getLine();
            }

            return $this->json($payload, Response::HTTP_SERVICE_UNAVAILABLE);
        }

        try {
            $this->userService->createUser([
                'username' => $username,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'email' => $email,
                'password' => $password,
                'role' => 'patient',
                'birthDate' => $birthRaw,
                'keycloakId' => $keycloakId,
            ]);
        } catch (\Throwable $e) {
            try {
                if ($keycloakId !== null) {
                    $this->keycloakPatientAdminService->deleteUser($keycloakId);
                }
            } catch (\Throwable) {
            }

            $msg = trim((string) $e->getMessage()) !== '' ? $e->getMessage() : "Erreur lors de l'inscription";
            $status = Response::HTTP_BAD_REQUEST;
            if ($e instanceof UniqueConstraintViolationException) {
                $status = Response::HTTP_CONFLICT;
                $msg = 'Cet email ou cet identifiant existe déjà en base.';
            } elseif ($this->isDuplicateDatabaseMessage($msg)) {
                $status = Response::HTTP_CONFLICT;
                $msg = 'Cet email ou cet identifiant existe déjà en base.';
            }
            $code = $e->getCode();
            if ($status !== Response::HTTP_CONFLICT
                && ($code === 409 || (is_numeric($code) && (int) $code === 409) || str_contains($msg, 'déjà'))) {
                $status = Response::HTTP_CONFLICT;
            }

            $payload = ['message' => $msg];
            if (($_ENV['APP_ENV'] ?? 'prod') === 'dev') {
                $payload['error'] = $e::class;
                $payload['location'] = basename($e->getFile()) . ':' . $e->getLine();
            }

            return $this->json($payload, $status);
        }

        $idPatient = null;
        try {
            $idPatient = $this->nephroPatientProfileClient->registerProfile($username, $email, $firstName, $lastName, $birthRaw);
        } catch (\Throwable) {
        }

        $message = $idPatient !== null
            ? 'Compte créé. Vous pouvez vous connecter.'
            : 'Compte créé. Démarrez la Gateway (8095) et le microservice dossiermedicale pour lier le dossier médical, ou réessayez plus tard.';

        return $this->json([
            'message' => $message,
            'idPatient' => $idPatient,
            'username' => $username,
            'nephroSynced' => $idPatient !== null,
        ], Response::HTTP_CREATED);
    }

    private function isDuplicateDatabaseMessage(string $msg): bool
    {
        $m = strtolower($msg);

        return str_contains($m, '23505')
            || str_contains($m, 'duplicate key')
            || str_contains($m, 'duplicate entry')
            || str_contains($m, 'unique constraint')
            || str_contains($m, 'already exists');
    }
}
