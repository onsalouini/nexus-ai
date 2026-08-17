<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class DirectorDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        if (!$user->company_id) {
            return response()->json([
                'message' => 'Aucune entreprise associée à cet utilisateur.'
            ], 422);
        }

        $companyId = $user->company_id;

        /*
        |--------------------------------------------------------------------------
        | COMPANY
        |--------------------------------------------------------------------------
        */

        $company = Company::find($companyId);

        if (!$company) {
            return response()->json([
                'message' => 'Entreprise introuvable.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | USERS / TEAM
        |--------------------------------------------------------------------------
        */

        $members = User::where('company_id', $companyId)
            ->select([
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'job_title',
                'avatar_path',
                'company_id',
            ])
            ->orderBy('first_name')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | PROJECTS
        |--------------------------------------------------------------------------
        */

        $projects = Project::where('company_id', $companyId)
            ->with([
                'chefDeProjet:id,first_name,last_name,email,job_title'
            ])
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | INVITATIONS
        |--------------------------------------------------------------------------
        */

        $invitations = Invitation::where('company_id', $companyId)
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | PROJECT STATISTICS
        |--------------------------------------------------------------------------
        */

        $totalProjects = $projects->count();

        $activeProjects = $projects
            ->whereIn('status', [
                'active',
                'in_progress',
                'in-progress',
                'ongoing',
            ])
            ->count();

        $completedProjects = $projects
            ->whereIn('status', [
                'completed',
                'complete',
                'finished',
                'done',
            ])
            ->count();

        $highRiskProjects = $projects
            ->filter(function ($project) {
                return
                    ($project->risk_score !== null && $project->risk_score >= 70)
                    ||
                    in_array(
                        strtolower((string) $project->risk_level),
                        ['high', 'critical', 'élevé', 'critique']
                    );
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | RISK
        |--------------------------------------------------------------------------
        */

        $projectsWithRisk = $projects->filter(
            fn ($project) => $project->risk_score !== null
        );

        $averageRisk = $projectsWithRisk->count() > 0
            ? round($projectsWithRisk->avg('risk_score'), 1)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | HEALTH SCORE
        |--------------------------------------------------------------------------
        |
        | Pour l'instant le score est dérivé du risk_score.
        | Plus tard, on pourra remplacer ceci par ton vrai modèle ML.
        |
        */

        $healthScore = max(
            0,
            min(
                100,
                round(100 - $averageRisk)
            )
        );

        /*
        |--------------------------------------------------------------------------
        | TEAM STATISTICS
        |--------------------------------------------------------------------------
        */

        $totalMembers = $members->count();

        $projectManagers = $members
            ->filter(function ($member) {
                $role = strtolower((string) $member->role);

                return in_array($role, [
                    'chef',
                    'chef_de_projet',
                    'chef de projet',
                    'project_manager',
                ]);
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | INVITATION STATISTICS
        |--------------------------------------------------------------------------
        */

        $pendingInvitations = $invitations
            ->filter(function ($invitation) {
                return is_null($invitation->accepted_at)
                    && $invitation->expires_at
                    && $invitation->expires_at->isFuture();
            })
            ->count();

        $acceptedInvitations = $invitations
            ->whereNotNull('accepted_at')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'director' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'job_title' => $user->job_title,
                'avatar_path' => $user->avatar_path,
            ],

            'company' => $company,

            'stats' => [
                'total_projects' => $totalProjects,
                'active_projects' => $activeProjects,
                'completed_projects' => $completedProjects,
                'high_risk_projects' => $highRiskProjects,
                'total_members' => $totalMembers,
                'project_managers' => $projectManagers,
                'pending_invitations' => $pendingInvitations,
                'accepted_invitations' => $acceptedInvitations,
                'average_risk' => $averageRisk,
                'health_score' => $healthScore,
            ],

            'projects' => $projects,

            'team' => $members,

            'invitations' => $invitations,

            'ai' => [
                'health_score' => $healthScore,
                'average_risk' => $averageRisk,
                'high_risk_projects' => $highRiskProjects,
            ],
        ]);
    }
}