<?php
namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findByRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.role = :role')
            ->andWhere('u.isActive = true')
            ->setParameter('role', $role)
            ->orderBy('u.lastName', 'ASC')
            ->getQuery()
            ->getArrayResult();
    }

    public function findActiveUsers(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = true')
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getArrayResult();
    }

    public function searchUsers(string $query): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.firstName LIKE :q OR u.lastName LIKE :q OR u.email LIKE :q')
            ->setParameter('q', '%' . $query . '%')
            ->getQuery()
            ->getArrayResult();
    }
}