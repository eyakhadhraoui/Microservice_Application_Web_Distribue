<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/**
 * Pour les routes /api/* : réponse JSON en cas d’exception non gérée (au lieu d’une page HTML 500).
 * Le corps contient "message" et "error" pour le débogage dans l’onglet Network du navigateur.
 */
final class ApiJsonExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::EXCEPTION => ['onKernelException', -256]];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $path = $event->getRequest()->getPathInfo() ?? '';
        if (!str_starts_with($path, '/api')) {
            return;
        }

        $throwable = $event->getThrowable();
        $status = Response::HTTP_INTERNAL_SERVER_ERROR;
        if ($throwable instanceof HttpExceptionInterface) {
            $code = $throwable->getStatusCode();
            $status = ($code >= 100 && $code < 600) ? $code : Response::HTTP_INTERNAL_SERVER_ERROR;
        }

        $payload = [
            'message' => trim((string) $throwable->getMessage()) !== '' ? $throwable->getMessage() : 'Erreur serveur',
            'error' => $throwable::class,
        ];

        $env = $_ENV['APP_ENV'] ?? 'prod';
        if ($env === 'dev') {
            $payload['file'] = $throwable->getFile();
            $payload['line'] = $throwable->getLine();
        }

        $event->setResponse(new JsonResponse($payload, $status));
    }
}
