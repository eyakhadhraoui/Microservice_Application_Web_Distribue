<?php
namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function createUser(array $data): User
    {
        // Vérifier si email existe déjà
        $existing = $this->userRepository->findOneBy(['email' => $data['email']]);
        if ($existing) {
            throw new \Exception('Email déjà utilisé', 409);
        }

        $user = new User();
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);
        $user->setEmail($data['email']);
        $user->setRole($data['role']);
        $user->setPhone($data['phone'] ?? null);
        $user->setAddress($data['address'] ?? null);

        // Hash du mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // Champs selon le rôle
        if (in_array($data['role'], ['MEDECIN', 'INFIRMIER', 'NUTRITIONNISTE'])) {
            $user->setSpecialty($data['specialty'] ?? null);
            $user->setLicenseNumber($data['licenseNumber'] ?? null);
            $user->setService($data['service'] ?? null);
        }

        if ($data['role'] === 'PATIENT') {
            $user->setBirthDate(new \DateTime($data['birthDate'] ?? 'now'));
            $user->setGender($data['gender'] ?? null);
            $user->setBloodGroup($data['bloodGroup'] ?? null);
            $user->setSocialSecurityNumber($data['socialSecurityNumber'] ?? null);
        }

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName'])) $user->setLastName($data['lastName']);
        if (isset($data['phone'])) $user->setPhone($data['phone']);
        if (isset($data['address'])) $user->setAddress($data['address']);
        if (isset($data['specialty'])) $user->setSpecialty($data['specialty']);
        if (isset($data['service'])) $user->setService($data['service']);

        if (isset($data['password'])) {
            $hashed = $this->passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashed);
        }

        $this->em->flush();
        return $user;
    }

    public function deactivateUser(User $user): void
    {
        $user->setIsActive(false);
        $this->em->flush();
    }

    public function formatUser(User $user): array
    {
        return [
            'id'            => $user->getId(),
            'firstName'     => $user->getFirstName(),
            'lastName'      => $user->getLastName(),
            'email'         => $user->getEmail(),
            'role'          => $user->getRole(),
            'phone'         => $user->getPhone(),
            'isActive'      => $user->isActive(),
            'specialty'     => $user->getSpecialty(),
            'licenseNumber' => $user->getLicenseNumber(),
            'service'       => $user->getService(),
            'birthDate'     => $user->getBirthDate()?->format('Y-m-d'),
            'gender'        => $user->getGender(),
            'bloodGroup'    => $user->getBloodGroup(),
            'createdAt'     => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}