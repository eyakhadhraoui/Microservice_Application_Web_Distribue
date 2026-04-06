<?php
namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/users')]
class UserController extends AbstractController
{
    public function __construct(
        private UserService $userService,
        private UserRepository $userRepository
    ) {}

    // GET tous les users
    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $users = $this->userRepository->findActiveUsers();

        return $this->json(array_map(fn (User $u) => $this->userService->formatUser($u), $users));
    }

    // Routes littérales avant /{id} (sinon "search" et "role" sont capturés comme id → erreur / 500)
    #[Route('/search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->query->get('q', '');
        $users = $this->userRepository->searchUsers($query);

        return $this->json(array_map(fn (User $u) => $this->userService->formatUser($u), $users));
    }

    #[Route('/role/{role}', methods: ['GET'])]
    public function byRole(string $role): JsonResponse
    {
        $roleNorm = strtolower($role);
        if (!in_array($roleNorm, ['medecin', 'patient'], true)) {
            return $this->json(['message' => 'Rôle invalide (patient ou medecin).'], Response::HTTP_BAD_REQUEST);
        }
        $users = $this->userRepository->findByRole($roleNorm);

        return $this->json(array_map(fn (User $u) => $this->userService->formatUser($u), $users));
    }

    // GET user par ID (id numérique uniquement — évite les collisions avec des segments texte)
    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }
        return $this->json($this->userService->formatUser($user));
    }

    // POST créer un user
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if (!is_array($data)) {
                return $this->json(['message' => 'Corps JSON invalide'], Response::HTTP_BAD_REQUEST);
            }
            $user = $this->userService->createUser($data);

            return $this->json($this->userService->formatUser($user), Response::HTTP_CREATED);
        } catch (\Throwable $e) {
            $status = Response::HTTP_BAD_REQUEST;
            if ($e instanceof HttpExceptionInterface) {
                $c = $e->getStatusCode();
                $status = ($c >= 100 && $c < 600) ? $c : Response::HTTP_BAD_REQUEST;
            } elseif ($e instanceof UniqueConstraintViolationException) {
                $status = Response::HTTP_CONFLICT;
            } else {
                $code = $e->getCode();
                if (is_int($code) && $code >= 400 && $code < 600) {
                    $status = $code;
                }
            }
            $msg = trim((string) $e->getMessage()) !== '' ? $e->getMessage() : "Erreur lors de la création de l'utilisateur";
            if ($e instanceof UniqueConstraintViolationException) {
                $msg = 'Cet email ou cet identifiant existe déjà.';
            }

            return $this->json(['message' => $msg], $status);
        }
    }

    // PUT modifier un user
    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Corps JSON invalide'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $updated = $this->userService->updateUser($user, $data);

            return $this->json($this->userService->formatUser($updated));
        } catch (\Throwable $e) {
            $status = Response::HTTP_BAD_REQUEST;
            if ($e instanceof HttpExceptionInterface) {
                $c = $e->getStatusCode();
                $status = ($c >= 100 && $c < 600) ? $c : Response::HTTP_BAD_REQUEST;
            } elseif ($e instanceof UniqueConstraintViolationException) {
                $status = Response::HTTP_CONFLICT;
            }
            $msg = trim((string) $e->getMessage()) !== '' ? $e->getMessage() : 'Mise à jour impossible';
            if ($e instanceof UniqueConstraintViolationException) {
                $msg = 'Cet email ou cet identifiant est déjà utilisé.';
            }

            return $this->json(['message' => $msg], $status);
        }
    }

    // DELETE désactiver un user
    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->userService->deactivateUser($user);
        return $this->json(['message' => 'Utilisateur désactivé avec succès']);
    }
}