<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChefTeamController extends Controller
{
    public function index(Request $request)
    {
        $chef = $request->user();

        $members = $chef->teamMembers()
            ->select([
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'job_title',
                'avatar_path',
            ])
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'members' => $members,
        ]);
    }
}