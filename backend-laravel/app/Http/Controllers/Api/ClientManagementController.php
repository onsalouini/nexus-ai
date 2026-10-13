<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/* Direction / chef : liste des comptes clients et rattachement d'un client à un projet. */
class ClientManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json(User::where('company_id', $user->company_id)
            ->where('role', 'client')
            ->with('clientProjects:id,name,client_id')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_path', 'avatar_color']));
    }

    public function assign(Request $request, Project $project)
    {
        $user = $request->user();
        abort_unless($project->company_id === $user->company_id
            && ($user->role === 'direction' || $project->chef_de_projet_id === $user->id), 403);

        $data = $request->validate([
            'client_id' => ['nullable', Rule::exists('users', 'id')->where('company_id', $user->company_id)->where('role', 'client')],
        ]);
        $project->update(['client_id' => $data['client_id']]);

        return response()->json($project->fresh()->load('client:id,first_name,last_name,email'));
    }
}
