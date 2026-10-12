<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/*
| Applique la langue choisie dans le frontend (en-tête Accept-Language : fr, en ou ar)
| aux messages de l'API, aux erreurs de validation et aux réponses de l'IA.
*/
class SetLocaleFromHeader
{
    public const SUPPORTED = ['fr', 'en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $header = strtolower(substr((string) $request->header('Accept-Language', ''), 0, 2));

        App::setLocale(in_array($header, self::SUPPORTED, true) ? $header : config('app.locale'));

        return $next($request);
    }
}
