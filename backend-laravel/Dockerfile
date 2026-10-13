FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    unzip git libzip-dev libssl-dev \
    && docker-php-ext-install pdo pdo_mysql zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader

# Plusieurs workers PHP : les requêtes (messagerie, notifications) ne s'attendent pas entre elles
ENV PHP_CLI_SERVER_WORKERS=4

EXPOSE 10000
CMD php artisan config:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=10000
