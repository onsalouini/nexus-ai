<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\ChangeRequest;
use App\Models\Company;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MessagingAndChangeRequestsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::create(['name' => 'Acme']);
        Http::fake(['*' => Http::response(['messageId' => 'x'])]);
    }

    private function user(string $role, array $extra = []): User
    {
        return User::forceCreate([
            'first_name' => ucfirst($role), 'last_name' => 'Test',
            'email' => uniqid($role) . '@example.com', 'password' => bcrypt('Password123!'),
            'role' => $role, 'company_id' => $this->company->id, ...$extra,
        ]);
    }

    private function project(User $chef, array $extra = []): Project
    {
        return Project::forceCreate([
            'name' => 'Projet ' . uniqid(), 'company_id' => $this->company->id, 'chef_de_projet_id' => $chef->id,
            'status' => 'en_cours', 'start_date' => now()->subDays(10), 'deadline' => now()->addDays(20),
            'team_exp' => 2, 'manager_exp' => 3, 'length' => 6, 'transactions' => 50, 'entities' => 10,
            'points_non_adjust' => 150, 'adjustment' => 1, 'language' => 1, 'planned_effort' => 1000, ...$extra,
        ]);
    }

    /* ---------------- Invitation du client par le chef ---------------- */

    public function test_chef_invites_project_client_who_signs_up_with_his_details(): void
    {
        $chef = $this->user('chef_de_projet');
        $project = $this->project($chef);
        $otherChefProject = $this->project($this->user('chef_de_projet'));

        Sanctum::actingAs($chef);
        $this->postJson('/api/invitations', ['email' => 'owner@client.com', 'role' => 'client', 'project_id' => $otherChefProject->id])
            ->assertForbidden();
        $this->postJson('/api/invitations', [
            'email' => 'owner@client.com', 'first_name' => 'Sami', 'role' => 'client',
            'project_id' => $project->id, 'organization' => 'Client SARL',
        ])->assertCreated();
        $this->getJson("/api/tracking/projects/{$project->id}")->assertJsonPath('client_invitation.email', 'owner@client.com');

        $token = Invitation::where('email', 'owner@client.com')->value('token');
        $this->getJson("/api/invitations/validate/{$token}")
            ->assertJsonPath('organization', 'Client SARL')->assertJsonPath('project', $project->name);

        VerificationCode::create(['email' => 'owner@client.com', 'code' => '111111', 'expires_at' => now()->addMinutes(5)])
            ->forceFill(['verified_at' => now()])->save();
        VerificationCode::create(['email' => 'intrus@client.com', 'code' => '111111', 'expires_at' => now()->addMinutes(5)])
            ->forceFill(['verified_at' => now()])->save();

        $payload = ['first_name' => 'Sami', 'last_name' => 'Ben Ali', 'password' => 'Password123!', 'password_confirmation' => 'Password123!',
            'invitation_token' => $token, 'phone' => '+216 22 000 000', 'organization' => 'Client SARL', 'job_title' => 'Gérant'];
        // L'invitation ne peut pas servir à créer un compte pour une autre adresse
        $this->postJson('/api/register', [...$payload, 'email' => 'intrus@client.com'])->assertUnprocessable();
        $this->postJson('/api/register', [...$payload, 'email' => 'owner@client.com'])->assertCreated()
            ->assertJsonPath('user.role', 'client')
            ->assertJsonPath('user.organization', 'Client SARL')
            ->assertJsonPath('user.job_title', 'Gérant')
            ->assertJsonPath('user.phone', '+216 22 000 000');

        $client = User::where('email', 'owner@client.com')->first();
        $this->assertSame($client->id, $project->fresh()->client_id);
        $this->getJson("/api/invitations/validate/{$token}")->assertNotFound(); // lien à usage unique
        Sanctum::actingAs($chef);
        $this->getJson("/api/tracking/projects/{$project->id}")->assertJsonPath('client.id', $client->id)->assertJsonPath('client_invitation', null);
    }

    /* ---------------- Suivi d'évolution + demandes de changement ---------------- */

    public function test_client_follows_evolution_and_sends_change_requests_to_chef(): void
    {
        $chef = $this->user('chef_de_projet');
        $client = $this->user('client');
        $project = $this->project($chef, ['client_id' => $client->id]);
        Task::create(['project_id' => $project->id, 'title' => 'Maquettes', 'status' => 'done', 'estimated_hours' => 10, 'completed_at' => now()->subDays(2)]);
        Task::create(['project_id' => $project->id, 'title' => 'API', 'status' => 'todo', 'estimated_hours' => 10]);

        Sanctum::actingAs($client);
        $res = $this->getJson("/api/client/projects/{$project->id}")->assertOk()
            ->assertJsonPath('timeline.0.title', 'Maquettes')
            ->assertJsonCount(2, 'tasks')
            ->json();
        $last = collect($res['evolution'])->whereNotNull('actual')->last();
        $this->assertSame(50, $last['actual']);
        $this->assertArrayNotHasKey('risk_level', $res['project']);

        $change = $this->postJson("/api/client/projects/{$project->id}/change-requests", [
            'title' => 'Ajouter le paiement en ligne', 'description' => 'Paiement par carte sur le site', 'priority' => 'high',
        ])->assertCreated()->json();
        $this->assertSame('change_request_new', AppNotification::where('user_id', $chef->id)->value('type'));

        // Un autre client ne peut ni voir ni modifier ce projet
        Sanctum::actingAs($this->user('client'));
        $this->getJson("/api/client/projects/{$project->id}")->assertForbidden();
        $this->postJson("/api/client/projects/{$project->id}/change-requests", ['title' => 'x', 'description' => 'y'])->assertForbidden();

        Sanctum::actingAs($chef);
        $this->getJson('/api/chef/change-requests')->assertOk()->assertJsonPath('pending', 1)->assertJsonPath('requests.0.client.id', $client->id);
        $this->patchJson("/api/chef/change-requests/{$change['id']}", ['status' => 'accepted', 'response' => 'Prévu au sprint 3'])
            ->assertOk()->assertJsonPath('status', 'accepted');
        $this->assertContains('change_request_updated', AppNotification::where('user_id', $client->id)->pluck('type')->all());

        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->patchJson("/api/chef/change-requests/{$change['id']}", ['status' => 'rejected'])->assertForbidden();

        Sanctum::actingAs($client);
        $this->getJson("/api/client/projects/{$project->id}")
            ->assertJsonPath('change_requests.0.response', 'Prévu au sprint 3')
            ->assertJsonPath('timeline.0.type', 'change_accepted');
        $this->assertSame(1, ChangeRequest::count());
    }

    /* ---------------- Messagerie interne ---------------- */

    public function test_messaging_contacts_follow_roles(): void
    {
        $director = $this->user('direction');
        $chef = $this->user('chef_de_projet');
        $otherChef = $this->user('chef_de_projet');
        $member = $this->user('membre_equipe', ['manager_id' => $chef->id]);
        $client = $this->user('client');
        $this->project($chef, ['client_id' => $client->id]);

        $ids = fn (User $u) => collect(Sanctum::actingAs($u) ? $this->getJson('/api/messages/contacts')->json() : [])->pluck('id')->sort()->values()->all();

        $this->assertEqualsCanonicalizing([$chef->id, $otherChef->id], $ids($director));
        $this->assertEqualsCanonicalizing([$director->id, $member->id, $client->id], $ids($chef));
        $this->assertEqualsCanonicalizing([$chef->id], $ids($member));
        $this->assertEqualsCanonicalizing([$chef->id], $ids($client));

        // Un client ne peut pas écrire à la direction ni à un employé
        Sanctum::actingAs($client);
        $this->postJson('/api/messages/conversations', ['user_id' => $director->id])->assertForbidden();
        $this->postJson('/api/messages/conversations', ['user_id' => $member->id])->assertForbidden();
        // Un autre chef d'une autre entreprise / sans lien : interdit
        Sanctum::actingAs($member);
        $this->postJson('/api/messages/conversations', ['user_id' => $otherChef->id])->assertForbidden();
    }

    public function test_conversation_flow_with_unread_counts_and_notifications(): void
    {
        $chef = $this->user('chef_de_projet');
        $client = $this->user('client');
        $this->project($chef, ['client_id' => $client->id]);

        Sanctum::actingAs($client);
        $conversation = $this->postJson('/api/messages/conversations', ['user_id' => $chef->id])->assertOk()->json();
        // Même paire : même conversation
        $this->assertSame($conversation['id'], $this->postJson('/api/messages/conversations', ['user_id' => $chef->id])->json('id'));

        $this->postJson("/api/messages/conversations/{$conversation['id']}", ['body' => 'Bonjour, où en est le projet ?'])->assertCreated();
        $this->postJson("/api/messages/conversations/{$conversation['id']}", ['body' => 'Merci !'])->assertCreated();

        // Une seule notification pour la série de messages non lus
        $this->assertSame(1, AppNotification::where('user_id', $chef->id)->where('type', 'message_new')->count());

        Sanctum::actingAs($chef);
        $this->getJson('/api/messages/unread')->assertJsonPath('unread', 2);
        $this->getJson('/api/messages/conversations')->assertJsonPath('conversations.0.unread', 2)
            ->assertJsonPath('conversations.0.other.id', $client->id);
        $show = $this->getJson("/api/messages/conversations/{$conversation['id']}")->assertOk()->assertJsonCount(2, 'messages')->json();
        $this->getJson('/api/messages/unread')->assertJsonPath('unread', 0);

        $this->postJson("/api/messages/conversations/{$conversation['id']}", ['body' => 'Livraison prévue vendredi.'])->assertCreated();
        $this->getJson("/api/messages/conversations/{$conversation['id']}?after={$show['messages'][1]['id']}")->assertJsonCount(1, 'messages');

        Sanctum::actingAs($client);
        $this->getJson('/api/messages/unread')->assertJsonPath('unread', 1);
        $this->assertSame('message_new', AppNotification::where('user_id', $client->id)->value('type'));

        // Un tiers ne lit pas la conversation
        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->getJson("/api/messages/conversations/{$conversation['id']}")->assertForbidden();
        $this->postJson("/api/messages/conversations/{$conversation['id']}", ['body' => 'x'])->assertForbidden();
    }
}
