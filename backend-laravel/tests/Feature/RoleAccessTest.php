<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $company = Company::create(['name' => 'Acme']);

        return User::forceCreate([
            'first_name' => 'Test',
            'last_name' => ucfirst($role),
            'email' => uniqid($role) . '@example.com',
            'password' => bcrypt('secret'),
            'role' => $role,
            'company_id' => $company->id,
        ]);
    }

    public function test_director_routes_are_reserved_to_direction(): void
    {
        foreach (['chef_de_projet', 'agent_support', 'membre_equipe'] as $role) {
            Sanctum::actingAs($this->userWithRole($role));
            $this->getJson('/api/director/dashboard')->assertForbidden();
            $this->getJson('/api/director/team')->assertForbidden();
        }

        Sanctum::actingAs($this->userWithRole('direction'));
        $this->getJson('/api/director/team')->assertOk();
    }

    public function test_employees_cannot_create_members_projects_or_invitations(): void
    {
        foreach (['agent_support', 'membre_equipe'] as $role) {
            Sanctum::actingAs($this->userWithRole($role));
            $this->postJson('/api/chef/team', [])->assertForbidden();
            $this->postJson('/api/projects', [])->assertForbidden();
            $this->postJson('/api/invitations', [])->assertForbidden();
        }
    }

    public function test_chef_cannot_invite_a_chef_de_projet(): void
    {
        Sanctum::actingAs($this->userWithRole('chef_de_projet'));

        $this->postJson('/api/invitations', [
            'email' => 'x@example.com',
            'role' => 'chef_de_projet',
        ])->assertForbidden();
    }

    public function test_chef_routes_still_work_for_chef(): void
    {
        Sanctum::actingAs($this->userWithRole('chef_de_projet'));

        $this->getJson('/api/projects')->assertOk();
        $this->getJson('/api/chef/team')->assertOk();
        $this->getJson('/api/projects/risk-predictions')->assertOk();
    }

    public function test_account_stays_available_to_everyone(): void
    {
        Sanctum::actingAs($this->userWithRole('membre_equipe'));
        $this->getJson('/api/account')->assertOk();
    }

    public function test_login_is_throttled(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'a@b.com', 'password' => 'wrong'])->assertStatus(401);
        }

        $this->postJson('/api/login', ['email' => 'a@b.com', 'password' => 'wrong'])->assertStatus(429);
    }
}
