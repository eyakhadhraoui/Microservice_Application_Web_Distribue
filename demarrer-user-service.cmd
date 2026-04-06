@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM === 1) Indique ici le chemin complet vers php.exe (PHP 8.2 ou plus) ===
REM Exemples après installation :
REM   set PHP_EXE=C:\php\php.exe
REM   set PHP_EXE=C:\wamp64\bin\php\php8.3.14\php.exe
REM   set PHP_EXE=C:\laragon\bin\php\php-8.3.12-Win32-vs16-x64\php.exe
set PHP_EXE=

if "%PHP_EXE%"=="" (
  where php >nul 2>&1
  if !errorlevel! equ 0 (
    set PHP_EXE=php
  )
)

if "%PHP_EXE%"=="" (
  echo.
  echo [ERREUR] PHP introuvable.
  echo.
  echo 1) Installe PHP 8.2+ : https://windows.php.net/download/
  echo    Dezip dans C:\php et copie php.ini-development vers php.ini
  echo    Dans php.ini, decommente : extension=pdo_pgsql et extension=pgsql
  echo.
  echo 2) OU installe WampServer 64 bits recent avec PHP 8.2+
  echo.
  echo 3) Ajoute le dossier de php.exe au PATH systeme :
  echo    Parametres - Systeme - A propos - Parametres avances - Variables d'environnement
  echo    Modifier Path - Ajouter le dossier qui contient php.exe
  echo.
  echo 4) OU edite ce fichier et definis PHP_EXE=... vers ton php.exe
  echo.
  pause
  exit /b 1
)

echo Utilisation de : %PHP_EXE%
"%PHP_EXE%" -v
if errorlevel 1 exit /b 1

cd /d "%~dp0"

echo.
echo --- Composer install ---
where composer >nul 2>&1
if errorlevel 1 (
  echo Installe Composer : https://getcomposer.org/download/
  pause
  exit /b 1
)
composer install
if errorlevel 1 pause & exit /b 1

echo.
echo --- Base PostgreSQL (DATABASE_URL dans .env) ---
"%PHP_EXE%" bin/console doctrine:database:create --if-not-exists
if errorlevel 1 pause & exit /b 1
"%PHP_EXE%" bin/console doctrine:migrations:migrate --no-interaction
if errorlevel 1 pause & exit /b 1

echo.
echo --- Serveur http://127.0.0.1:8000 (aligne proxy Angular + Gateway) ---
echo Arreter : Ctrl+C
"%PHP_EXE%" -S 127.0.0.1:8000 -t public

endlocal
