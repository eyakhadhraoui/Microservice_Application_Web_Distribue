<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Si la colonne username n’existe pas (migration 20260403160000 non jouée), l’ajoute.
 * Évite l’erreur SQL « column username does not exist » à l’inscription.
 */
final class Version20260404180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Colonne username sur "user" (idempotent, PostgreSQL)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS username VARCHAR(100) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_username ON "user" (username)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS uniq_user_username');
    }
}
