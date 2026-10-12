<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/*
| Restreint un groupe de routes à un ou plusieurs rôles.
| Usage : ->middleware('role:direction') ou ->middleware('role:direction,chef_de_projet')
*/
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => __('Accès non autorisé pour votre rôle.')], 403);
        }

        return $next($request);
    }
}
