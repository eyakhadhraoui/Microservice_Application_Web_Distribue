# API Symfony (user-service) — PHP built-in, port 8000.
FROM composer:2 AS composer_deps
WORKDIR /app
COPY composer.json composer.lock symfony.lock* ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

FROM php:8.4-cli-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql opcache \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV APP_ENV=prod
COPY --from=composer_deps /app/vendor ./vendor
COPY . .
EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
