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
        // Validation des champs requis
        if (empty(trim((string) ($data['firstName'] ?? '')))) {
            throw new \Exception('Prénom requis', 400);
        }
        if (empty(trim((string) ($data['lastName'] ?? '')))) {
            throw new \Exception('Nom requis', 400);
        }
        if (empty(trim((string) ($data['username'] ?? '')))) {
            throw new \Exception('Username requis', 400);
        }
        if (empty(trim((string) ($data['email'] ?? '')))) {
            throw new \Exception('Email requis', 400);
        }
        if (empty($data['password'])) {
            throw new \Exception('Mot de passe requis', 400);
        }
        if (!in_array($data['role'] ?? '', ['medecin', 'patient'])) {
            throw new \Exception('Rôle invalide. Valeurs acceptées : medecin, patient.', 400);
        }

        // Vérifier unicité email
        $existing = $this->userRepository->findOneBy(['email' => $data['email']]);
        if ($existing) {
            throw new \Exception('Email déjà utilisé.', 409);
        }

        // Vérifier unicité username
        $byLogin = $this->userRepository->findOneBy(['username' => $data['username']]);
        if ($byLogin) {
            throw new \Exception('Cet identifiant est déjà utilisé.', 409);
        }

        $user = new User();
        $user->setUsername($data['username']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);
        $user->setEmail($data['email']);
        $user->setRole($data['role']);
        $user->setPhone($data['phone'] ?? null);
        $user->setAddress($data['address'] ?? null);

        // Hash du mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // Champs spécifiques MÉDECIN
        if ($data['role'] === 'medecin') {
            $user->setSpecialty($data['specialty'] ?? null);
            $user->setLicenseNumber($data['licenseNumber'] ?? null);
            $user->setService($data['service'] ?? null);
        }

        // Champs spécifiques PATIENT
        if ($data['role'] === 'patient') {
            if (!empty($data['birthDate'])) {
                $birthDt = \DateTimeImmutable::createFromFormat('Y-m-d', $data['birthDate']);
                if ($birthDt === false) {
                    throw new \Exception('Date de naissance invalide (format attendu : AAAA-MM-JJ).', 400);
                }
                $user->setBirthDate($birthDt);
            }
            $user->setGender($data['gender'] ?? null);
            $user->setBloodGroup($data['bloodGroup'] ?? null);
            $user->setSocialSecurityNumber($data['socialSecurityNumber'] ?? null);
        }

        // Keycloak ID
        if (!empty($data['keycloakId'])) {
            $user->setKeycloakId((string) $data['keycloakId']);
        }

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['username'])) {
            $login = trim((string) $data['username']);
            $byLogin = $this->userRepository->findOneBy(['username' => $login]);
            if ($byLogin !== null && $byLogin->getId() !== $user->getId()) {
                throw new \Exception('Cet identifiant est déjà utilisé.', 409);
            }
            $user->setUsername($login);
        }
        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName'])) $user->setLastName($data['lastName']);
        if (isset($data['email'])) {
            $email = trim((string) $data['email']);
            $existing = $this->userRepository->findOneBy(['email' => $email]);
            if ($existing !== null && $existing->getId() !== $user->getId()) {
                throw new \Exception('Email déjà utilisé.', 409);
            }
            $user->setEmail($email);
        }
        if (isset($data['phone'])) $user->setPhone($data['phone']);
        if (isset($data['address'])) $user->setAddress($data['address']);

        // Champs médecin
        if (isset($data['specialty'])) $user->setSpecialty($data['specialty']);
        if (isset($data['licenseNumber'])) $user->setLicenseNumber($data['licenseNumber']);
        if (isset($data['service'])) $user->setService($data['service']);

        // Champs patient
        if (isset($data['birthDate'])) {
            $birthDt = \DateTimeImmutable::createFromFormat('Y-m-d', $data['birthDate']);
            if ($birthDt !== false) {
                $user->setBirthDate($birthDt);
            }
        }
        if (isset($data['gender'])) $user->setGender($data['gender']);
        if (isset($data['bloodGroup'])) $user->setBloodGroup($data['bloodGroup']);
        if (isset($data['socialSecurityNumber'])) $user->setSocialSecurityNumber($data['socialSecurityNumber']);

        // Mot de passe
        if (!empty($data['password'])) {
            $hashed = $this->passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashed);
        }

        // Keycloak
        if (!empty($data['keycloakId'])) {
            $user->setKeycloakId((string) $data['keycloakId']);
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
            'id'                   => $user->getId(),
            'username'             => $user->getUsername(),
            'firstName'            => $user->getFirstName(),
            'lastName'             => $user->getLastName(),
            'email'                => $user->getEmail(),
            'role'                 => $user->getRole(),
            'phone'                => $user->getPhone(),
            'address'              => $user->getAddress(),
            'isActive'             => $user->isActive(),
            // Médecin
            'specialty'            => $user->getSpecialty(),
            'licenseNumber'        => $user->getLicenseNumber(),
            'service'              => $user->getService(),
            // Patient
            'birthDate'            => $user->getBirthDate()?->format('Y-m-d'),
            'gender'               => $user->getGender(),
            'bloodGroup'           => $user->getBloodGroup(),
            'socialSecurityNumber' => $user->getSocialSecurityNumber(),
            // Méta
            'keycloakId'           => $user->getKeycloakId(),
            'createdAt'            => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt'            => $user->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}