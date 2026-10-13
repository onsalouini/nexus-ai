<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class DirectorTeamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => __('Utilisateur non authentifié.')
            ], 401);
        }

        if (!$user->company_id) {
            return response()->json([
                'message' => __('Aucune entreprise associée.')
            ], 422);
        }

        $chefs = User::where('company_id', $user->company_id)
            ->where('role', 'chef_de_projet')
            ->with([
                'teamMembers' => function ($query) {
                    $query->select([
                        'id',
                        'first_name',
                        'last_name',
                        'email',
                        'role',
                        'company_id',
                        'manager_id',
                        'job_title',
                        'avatar_path',
                        'avatar_color',
                        'cv_path',
                    ]);
                }
            ])
            ->orderBy('first_name')
            ->get([
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'company_id',
                'manager_id',
                'job_title',
                'avatar_path',
                'avatar_color',
                'cv_path',
            ]);

        return response()->json($chefs);
    }

    public function show(Request $request, User $member)
    {
        $user = $request->user();

        if (!$user || $member->company_id !== $user->company_id) {
            return response()->json([
                'message' => __('Accès non autorisé.')
            ], 403);
        }

        $member->load([
            'manager:id,first_name,last_name,email,job_title,avatar_path,avatar_color',
            'projects:id,name,status,risk_score',
        ]);

        return response()->json($member);
    }
}