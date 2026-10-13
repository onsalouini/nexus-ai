<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Company;
use App\Models\FinancialHealthReport;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use App\Models\UserAvatar;
use App\Models\VerificationCode;
use App\Services\RiskAlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalAndAlertsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Acme']);
        config([
            'services.ai.url' => 'http://ai.test',
            'services.ticket_ai.url' => 'http://tickets.test',
            'services.brevo.api_key' => 'brevo-key',
        ]);

        Http::fake([
            'ai.test/*' => Http::response(['predicted_effort_hours' => 1500, 'risk_level' => 'Élevé', 'gap_percent' => 50, 'explanation' => null]),
            'tickets.test/predict' => Http::response([
                'category' => 'bug', 'urgency' => 'critical', 'sentiment' => 'negative',
                'confidence' => ['category' => 0.91, 'urgency' => 0.84, 'sentiment' => 0.88], 'model_version' => 'test',
            ]),
            'tickets.test/train' => Http::response(['status' => 'trained', 'model' => ['version' => 'v2', 'n_feedback' => 1]]),
            'api.brevo.com/*' => Http::response(['messageId' => 'x']),
        ]);
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
            'status' => 'en_cours', 'team_exp' => 2, 'manager_exp' => 3, 'length' => 6, 'transactions' => 50,
            'entities' => 10, 'points_non_adjust' => 150, 'adjustment' => 1, 'language' => 1, 'planned_effort' => 1000,
            ...$extra,
        ]);
    }

    private function types(User $user): array
    {
        return AppNotification::where('user_id', $user->id)->pluck('type')->all();
    }

    /* ---------------- Compte client + photo en base ---------------- */

    public function test_client_invitation_signup_with_photo_stored_in_database(): void
    {
        $chef = $this->user('chef_de_projet');
        $project = $this->project($chef);
        Invitation::create([
            'email' => 'client@example.com', 'role' => 'client', 'project_id' => $project->id, 'token' => 'client-token',
            'company_id' => $this->company->id, 'invited_by' => $chef->id, 'expires_at' => now()->addDays(7),
        ]);
        VerificationCode::create(['email' => 'client@example.com', 'code' => '111111', 'expires_at' => now()->addMinutes(5)])
            ->forceFill(['verified_at' => now()])->save();

        $res = $this->post('/api/register', [
            'first_name' => 'Cli', 'last_name' => 'Ent', 'email' => 'client@example.com',
            'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'invitation_token' => 'client-token',
            'avatar' => UploadedFile::fake()->image('me.png', 64, 64),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('user.role', 'client');

        $client = User::where('email', 'client@example.com')->first();
        $this->assertStringStartsWith("api/avatars/{$client->id}?v=", $res->json('user.avatar_path'));
        $this->assertTrue(UserAvatar::where('user_id', $client->id)->exists());
        $this->get("/api/avatars/{$client->id}")->assertOk()->assertHeader('Content-Type', 'image/png');

        // Le client suit le projet (sans rejoindre l'équipe) et l'inviteur est notifié
        $this->assertSame($client->id, $project->fresh()->client_id);
        $this->assertFalse($project->team()->where('users.id', $client->id)->exists());
        $this->assertContains('invitation_accepted', $this->types($chef));

        Sanctum::actingAs($client);
        $this->getJson('/api/client/projects')->assertOk()
            ->assertJsonPath('projects.0.id', $project->id)
            ->assertJsonMissingPath('projects.0.risk_level');
        $this->getJson('/api/tickets')->assertForbidden();
        $this->getJson('/api/projects')->assertForbidden();
    }

    public function test_signup_with_initials_color_and_avatar_removal(): void
    {
        VerificationCode::create(['email' => 'boss@example.com', 'code' => '111111', 'expires_at' => now()->addMinutes(5)])
            ->forceFill(['verified_at' => now()])->save();

        $this->postJson('/api/register', [
            'first_name' => 'Bo', 'last_name' => 'Ss', 'email' => 'boss@example.com',
            'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'avatar_color' => 'violet',
        ])->assertCreated()->assertJsonPath('user.avatar_color', 'violet')->assertJsonPath('user.avatar_path', null);

        $user = User::where('email', 'boss@example.com')->first();
        Sanctum::actingAs($user);
        $this->post('/api/account/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json'])->assertOk();
        $this->assertNotNull($user->fresh()->avatar_path);

        $this->deleteJson('/api/account/avatar', ['avatar_color' => 'emerald'])->assertOk()
            ->assertJsonPath('user.avatar_path', null)->assertJsonPath('user.avatar_color', 'emerald');
        $this->assertFalse(UserAvatar::where('user_id', $user->id)->exists());
        $this->get("/api/avatars/{$user->id}")->assertNotFound();

        $this->putJson('/api/account/preferences', ['avatar_color' => 'pink'])->assertUnprocessable();
        $this->putJson('/api/account/preferences', ['email_alerts' => false])->assertOk()->assertJsonPath('user.email_alerts', false);
    }

    /* ---------------- Tickets client : tri ML + fil de discussion + notifications ---------------- */

    public function test_client_ticket_is_triaged_by_ml_model_and_conversation_notifies_both_sides(): void
    {
        $chef = $this->user('chef_de_projet');
        $client = $this->user('client');
        $agent = $this->user('agent_support');
        $project = $this->project($chef, ['client_id' => $client->id]);
        $otherProject = $this->project($chef);

        Sanctum::actingAs($client);
        $this->postJson('/api/client/tickets', ['title' => 'Bug', 'description' => 'Tout plante', 'project_id' => $otherProject->id])
            ->assertUnprocessable();
        $ticket = $this->postJson('/api/client/tickets', ['title' => 'Site en panne', 'description' => 'Plus rien ne marche', 'project_id' => $project->id])
            ->assertCreated()
            ->assertJsonPath('triage_source', 'ml')
            ->assertJsonPath('urgency', 'critical')
            ->assertJsonPath('triage_confidence.category', 0.91)
            ->assertJsonPath('customer_email', $client->email)
            ->json();

        // Ticket critique : notification + email Brevo à l'agent
        $this->assertSame(['ticket_new'], $this->types($agent));
        $this->assertSame('critical', AppNotification::where('user_id', $agent->id)->value('severity'));
        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), 'api.brevo.com') && $r['to'][0]['email'] === $agent->email);

        Sanctum::actingAs($agent);
        $this->getJson("/api/tickets/{$ticket['id']}")->assertOk()->assertJsonPath('project.name', $project->name);
        $this->postJson("/api/tickets/{$ticket['id']}/suggest-reply")->assertOk()->assertJsonStructure(['reply']);
        $this->postJson("/api/tickets/{$ticket['id']}/messages", ['body' => 'Nous regardons.'])->assertCreated()
            ->assertJsonPath('status', 'in_progress')
            ->assertJsonPath('assigned_to', $agent->id)
            ->assertJsonPath('messages.0.body', 'Nous regardons.');
        $this->assertContains('ticket_reply', $this->types($client));

        Sanctum::actingAs($client);
        $this->postJson("/api/client/tickets/{$ticket['id']}/messages", ['body' => 'Merci, toujours bloqué.'])->assertCreated();
        $this->assertContains('ticket_client_reply', $this->types($agent));
        $this->getJson('/api/client/tickets')->assertJsonPath('tickets.0.messages_count', 2);
        $this->postJson("/api/client/tickets/{$ticket['id']}/close")->assertOk()->assertJsonPath('status', 'closed');

        // Un autre client ne voit pas ce ticket
        Sanctum::actingAs($this->user('client'));
        $this->getJson("/api/client/tickets/{$ticket['id']}")->assertForbidden();
    }

    public function test_ticket_triage_falls_back_to_keywords_when_ml_service_is_down(): void
    {
        config(['services.ticket_ai.url' => 'http://down.test']);
        Http::fake(['down.test/*' => Http::response('', 500), 'api.brevo.com/*' => Http::response([])]);

        Sanctum::actingAs($this->user('agent_support'));
        $this->postJson('/api/tickets', ['title' => 'Facture', 'description' => 'Remboursement de ma facture svp'])
            ->assertCreated()->assertJsonPath('triage_source', 'keywords')->assertJsonPath('category', 'billing');
    }

    public function test_agent_corrections_retrain_the_model(): void
    {
        Ticket::create(['company_id' => $this->company->id, 'title' => 'A', 'description' => 'B', 'category' => 'billing', 'classification_corrected' => true]);
        Ticket::create(['company_id' => $this->company->id, 'title' => 'C', 'description' => 'D']);

        Sanctum::actingAs($this->user('agent_support'));
        $this->postJson('/api/tickets/model/retrain')->assertForbidden();

        Sanctum::actingAs($this->user('direction'));
        $this->postJson('/api/tickets/model/retrain')->assertOk()->assertJsonPath('samples', 1)->assertJsonPath('model.version', 'v2');
        Http::assertSent(fn (HttpRequest $r) => str_ends_with($r->url(), '/train') && count($r['samples']) === 1);
    }

    /* ---------------- Alertes de risque projet / faillite ---------------- */

    public function test_high_project_risk_alerts_chef_and_direction_by_notification_and_email(): void
    {
        $chef = $this->user('chef_de_projet');
        $director = $this->user('direction');
        $member = $this->user('membre_equipe');
        $project = $this->project($chef);

        Sanctum::actingAs($chef);
        $this->putJson("/api/projects/{$project->id}", ['planned_effort' => 900])->assertOk();

        foreach ([$chef, $director] as $user) {
            $alert = AppNotification::where('user_id', $user->id)->where('type', 'project_risk_alert')->first();
            $this->assertNotNull($alert);
            $this->assertSame('critical', $alert->severity);
            $this->assertSame(50, $alert->data['risk_score']);
            $this->assertNotNull($alert->emailed_at);
        }
        $this->assertSame([], $this->types($member));

        // Même prédiction : pas de doublon
        $this->putJson("/api/projects/{$project->id}", ['planned_effort' => 900])->assertOk();
        $this->assertSame(1, AppNotification::where('user_id', $chef->id)->where('type', 'project_risk_alert')->count());

        $this->getJson('/api/alerts')->assertOk()->assertJsonPath('projects.0.id', $project->id)->assertJsonPath('thresholds.risk', 35);
    }

    public function test_periodic_scan_notifies_existing_risks_without_sending_emails(): void
    {
        $chef = $this->user('chef_de_projet');
        $this->project($chef, ['risk_level' => 'Élevé', 'risk_score' => 60]);

        Sanctum::actingAs($chef);
        $this->getJson('/api/notifications')->assertOk()->assertJsonPath('notifications.0.type', 'project_risk_alert');
        $this->artisan('nexus:scan-alerts')->assertSuccessful();

        $this->assertSame(1, AppNotification::where('user_id', $chef->id)->where('type', 'project_risk_alert')->count());
        $this->assertNull(AppNotification::where('user_id', $chef->id)->value('emailed_at'));
        Http::assertNotSent(fn (HttpRequest $r) => str_contains($r->url(), 'api.brevo.com'));
    }

    public function test_bankruptcy_alert_and_configurable_thresholds(): void
    {
        $director = $this->user('direction');
        $director->update(['email_alerts' => false]);
        $report = FinancialHealthReport::create([
            'company_id' => $this->company->id, 'user_id' => $director->id, 'health_score' => 30,
            'financial_health' => 'at_risk', 'bankruptcy_probability' => 0.7, 'decision_threshold' => 0.5,
        ]);

        app(RiskAlertService::class)->checkFinancialReport($report);
        $alert = AppNotification::where('user_id', $director->id)->where('type', 'bankruptcy_alert')->first();
        $this->assertNotNull($alert);
        $this->assertEquals(70, $alert->data['probability']);
        $this->assertNull($alert->emailed_at); // emails désactivés par l'utilisateur

        Sanctum::actingAs($director);
        $this->getJson('/api/alerts')->assertJsonPath('bankruptcy.alert', true);
        $this->putJson('/api/alerts/settings', ['risk_alert_threshold' => 60, 'bankruptcy_alert_threshold' => 80])->assertOk()
            ->assertJsonPath('bankruptcy', 80);
        $this->getJson('/api/alerts')->assertJsonPath('bankruptcy.alert', false);

        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->putJson('/api/alerts/settings', ['risk_alert_threshold' => 60, 'bankruptcy_alert_threshold' => 80])->assertForbidden();
    }

    /* ---------------- Notifications persistantes ---------------- */

    public function test_task_assignment_notifies_member_and_notifications_can_be_read_or_deleted(): void
    {
        $chef = $this->user('chef_de_projet');
        $member = $this->user('membre_equipe', ['manager_id' => $chef->id]);
        $project = $this->project($chef);

        Sanctum::actingAs($chef);
        $task = $this->postJson('/api/tasks', ['project_id' => $project->id, 'title' => 'Maquette', 'assigned_to' => $member->id])
            ->assertCreated()->json();

        Sanctum::actingAs($member);
        $list = $this->getJson('/api/notifications')->assertOk()->assertJsonPath('unread', 1)
            ->assertJsonPath('notifications.0.type', 'task_assigned')
            ->assertJsonPath('notifications.0.data.task', 'Maquette')
            ->json('notifications');

        $this->postJson("/api/notifications/{$list[0]['id']}/read")->assertOk()->assertJsonPath('unread', 0);

        // Le membre termine la tâche : le chef est notifié
        $this->patchJson("/api/me/tasks/{$task['id']}", ['status' => 'done'])->assertOk();
        $this->assertContains('task_completed', $this->types($chef));

        $this->deleteJson("/api/notifications/{$list[0]['id']}")->assertOk();
        $this->assertSame(0, AppNotification::where('user_id', $member->id)->count());

        // On ne peut pas lire les notifications d'un autre
        $other = AppNotification::where('user_id', $chef->id)->first();
        $this->postJson("/api/notifications/{$other->id}/read")->assertForbidden();
    }
}
