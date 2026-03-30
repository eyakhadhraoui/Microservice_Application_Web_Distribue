<?php
namespace App\Controller;

use App\Repository\UserRepository;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
        return $this->json($users);
    }

    // GET user par ID
    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], 404);
        }
        return $this->json($this->userService->formatUser($user));
    }

    // GET users par rôle
    #[Route('/role/{role}', methods: ['GET'])]
    public function byRole(string $role): JsonResponse
    {
        $users = $this->userRepository->findByRole(strtoupper($role));
        return $this->json($users);
    }

    // POST créer un user
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $user = $this->userService->createUser($data);
            return $this->json($this->userService->formatUser($user), 201);
        } catch (\Exception $e) {
            return $this->json(['message' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    // PUT modifier un user
    #[Route('/{id}', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $updated = $this->userService->updateUser($user, $data);
        return $this->json($this->userService->formatUser($updated));
    }

    // DELETE désactiver un user
    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $this->userService->deactivateUser($user);
        return $this->json(['message' => 'Utilisateur désactivé avec succès']);
    }

    // GET recherche
    #[Route('/search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        $users = $this->userRepository->searchUsers($query);
        return $this->json($users);
    }
}