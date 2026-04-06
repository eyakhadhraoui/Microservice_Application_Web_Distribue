<?php
namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Identifiant de connexion (Keycloak / login), distinct de l’email. */
    #[ORM\Column(length: 100, unique: true)]
    #[Assert\NotBlank]
    private ?string $username = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    private ?string $firstName = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    private ?string $lastName = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['medecin','patient'])]
    private ?string $role = null;

    // Champs communs
    #[ORM\Column(length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isActive = true;

    // Champs spécifiques MÉDECIN / INFIRMIER / NUTRITIONNISTE
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $specialty = null;  // ex: Néphrologue pédiatrique

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $licenseNumber = null;  // Numéro d'ordre

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $service = null;  // Service hospitalier

    // Champs spécifiques patient
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $birthDate = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Assert\Choice(choices: ['M', 'F'])]
    private ?string $gender = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $bloodGroup = null;  // Groupe sanguin

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $socialSecurityNumber = null;

    // Keycloak
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $keycloakId = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // --- UserInterface ---
    public function getRoles(): array
    {
        return ['ROLE_' . $this->role];
    }

    public function eraseCredentials(): void {}

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    // --- Getters & Setters ---
    public function getId(): ?int { return $this->id; }

    public function getUsername(): ?string { return $this->username; }
    public function setUsername(string $username): static { $this->username = $username; return $this; }

    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(string $firstName): static { $this->firstName = $firstName; return $this; }

    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(string $lastName): static { $this->lastName = $lastName; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function getRole(): ?string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $address): static { $this->address = $address; return $this; }

    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }

    public function getSpecialty(): ?string { return $this->specialty; }
    public function setSpecialty(?string $specialty): static { $this->specialty = $specialty; return $this; }

    public function getLicenseNumber(): ?string { return $this->licenseNumber; }
    public function setLicenseNumber(?string $licenseNumber): static { $this->licenseNumber = $licenseNumber; return $this; }

    public function getService(): ?string { return $this->service; }
    public function setService(?string $service): static { $this->service = $service; return $this; }

    public function getBirthDate(): ?\DateTimeImmutable { return $this->birthDate; }
    public function setBirthDate(?\DateTimeImmutable $birthDate): static { $this->birthDate = $birthDate; return $this; }

    public function getGender(): ?string { return $this->gender; }
    public function setGender(?string $gender): static { $this->gender = $gender; return $this; }

    public function getBloodGroup(): ?string { return $this->bloodGroup; }
    public function setBloodGroup(?string $bloodGroup): static { $this->bloodGroup = $bloodGroup; return $this; }

    public function getSocialSecurityNumber(): ?string { return $this->socialSecurityNumber; }
    public function setSocialSecurityNumber(?string $ssn): static { $this->socialSecurityNumber = $ssn; return $this; }

    public function getKeycloakId(): ?string { return $this->keycloakId; }
    public function setKeycloakId(?string $keycloakId): static { $this->keycloakId = $keycloakId; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}