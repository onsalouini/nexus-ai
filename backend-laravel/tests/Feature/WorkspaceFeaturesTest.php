<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\FinancialHealthReport;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\ProjectReport;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\TotpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Acme']);
        config(['services.groq.key' => 'test-key', 'services.ai.url' => 'http://ai.test']);

        Http::fake([
            'ai.test/*' => Http::response([
                'predicted_effort_hours' => 1500,
                'risk_level' => 'Élevé',
                'gap_percent' => 50,
                'explanation' => ['sensitivity' => [['feature' => 'TeamExp', 'label' => 'x', 'value' => 2, 'impact_hours' => 10]], 'global_importance' => []],
            ]),
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode([
                'summary' => 'Résumé', 'health' => 'Moyenne', 'strengths' => ['A'],
                'risks' => [['title' => 'R', 'description' => 'D', 'severity' => 'Élevée']],
                'recommendations' => ['Rec'], 'effort_analysis' => 'E', 'final_verdict' => 'V',
            ])]]]]),
            'api.brevo.com/*' => Http::response(['messageId' => 'x']),
        ]);
    }

    private function user(string $role, array $extra = []): User
    {
        return User::forceCreate([
            'first_name' => ucfirst($role),
            'last_name' => 'Test',
            'email' => uniqid($role) . '@example.com',
            'password' => bcrypt('Password123!'),
            'role' => $role,
            'company_id' => $this->company->id,
            ...$extra,
        ]);
    }

    private function project(User $chef, array $extra = []): Project
    {
        return Project::forceCreate([
            'name' => 'Projet ' . uniqid(),
            'company_id' => $this->company->id,
            'chef_de_projet_id' => $chef->id,
            'status' => 'en_cours',
            'team_exp' => 2, 'manager_exp' => 3, 'length' => 6, 'transactions' => 50,
            'entities' => 10, 'points_non_adjust' => 150, 'adjustment' => 1, 'language' => 1,
            'planned_effort' => 1000,
            ...$extra,
        ]);
    }

    /* ---------------- Espace employé ---------------- */

    public function test_employee_sees_and_updates_only_his_tasks(): void
    {
        $chef = $this->user('chef_de_projet');
        $member = $this->user('membre_equipe', ['manager_id' => $chef->id]);
        $other = $this->user('membre_equipe');
        $project = $this->project($chef);
        $project->team()->attach($member->id);

        $mine = Task::create(['project_id' => $project->id, 'title' => 'Ma tâche', 'assigned_to' => $member->id, 'estimated_hours' => 4]);
        $notMine = Task::create(['project_id' => $project->id, 'title' => 'Autre', 'assigned_to' => $other->id]);

        Sanctum::actingAs($member);
        $this->getJson('/api/me/tasks')->assertOk()->assertJsonCount(1, 'tasks')->assertJsonPath('tasks.0.title', 'Ma tâche');
        $this->getJson('/api/me/projects')->assertOk()->assertJsonPath('projects.0.id', $project->id)->assertJsonPath('projects.0.my_open_tasks', 1);

        $this->patchJson("/api/me/tasks/{$mine->id}", ['status' => 'done', 'spent_hours' => 3])->assertOk();
        $this->assertSame('done', $mine->fresh()->status);
        $this->assertNotNull($mine->fresh()->completed_at);
        // 4 h terminées sur 5 h pondérées (l'autre tâche reste à faire)
        $this->assertSame(80, $project->fresh()->progress);

        $this->patchJson("/api/me/tasks/{$notMine->id}", ['status' => 'done'])->assertForbidden();

        Sanctum::actingAs($chef);
        $this->getJson('/api/me/tasks')->assertForbidden();
    }

    /* ---------------- Tickets support ---------------- */

    public function test_ticket_is_triaged_and_handled_by_agent(): void
    {
        $agent = $this->user('agent_support');
        Sanctum::actingAs($agent);

        $ticket = $this->postJson('/api/tickets', [
            'title' => 'Urgent : erreur en production',
            'description' => "Le site plante, c'est inacceptable !",
            'customer_email' => 'client@example.com',
        ])->assertCreated()
            ->assertJsonPath('category', 'bug')
            ->assertJsonPath('urgency', 'critical')
            ->assertJsonPath('sentiment', 'negative')
            ->json();

        $this->postJson('/api/tickets', ['title' => 'Merci', 'description' => 'Super produit, je voudrais une nouvelle fonctionnalité'])
            ->assertCreated()->assertJsonPath('urgency', 'low');

        // File triée : le ticket critique en premier
        $this->getJson('/api/tickets')->assertOk()->assertJsonPath('tickets.0.id', $ticket['id'])->assertJsonPath('stats.critical_open', 1);

        $this->patchJson("/api/tickets/{$ticket['id']}", ['assigned_to' => $agent->id, 'status' => 'in_progress'])->assertOk();
        $this->patchJson("/api/tickets/{$ticket['id']}", ['urgency' => 'high'])->assertOk()->assertJsonPath('classification_corrected', true);
        $this->patchJson("/api/tickets/{$ticket['id']}", ['status' => 'resolved'])->assertOk();
        $this->assertNotNull(Ticket::find($ticket['id'])->resolved_at);
        $this->getJson('/api/tickets?mine=1')->assertOk()->assertJsonCount(0, 'tickets');
    }

    public function test_tickets_are_isolated_per_company_and_role(): void
    {
        $otherCompany = Company::create(['name' => 'Other']);
        $foreign = Ticket::create(['company_id' => $otherCompany->id, 'title' => 'X', 'description' => 'Y']);

        Sanctum::actingAs($this->user('agent_support'));
        $this->patchJson("/api/tickets/{$foreign->id}", ['status' => 'closed'])->assertForbidden();
        $this->getJson('/api/tickets')->assertJsonCount(0, 'tickets');

        Sanctum::actingAs($this->user('membre_equipe'));
        $this->getJson('/api/tickets')->assertForbidden();
    }

    /* ---------------- Notifications ---------------- */

    public function test_notifications_for_late_tasks_high_risk_and_accepted_invitations(): void
    {
        $chef = $this->user('chef_de_projet');
        $member = $this->user('membre_equipe');
        $project = $this->project($chef, ['risk_level' => 'Élevé']);
        Task::create(['project_id' => $project->id, 'title' => 'En retard', 'assigned_to' => $member->id, 'due_date' => now()->subDays(3)]);
        Invitation::create([
            'email' => 'new@example.com', 'first_name' => 'Nora', 'role' => 'membre_equipe', 'token' => 'tok',
            'company_id' => $this->company->id, 'invited_by' => $chef->id, 'expires_at' => now()->addDays(7),
        ])->forceFill(['accepted_at' => now()])->save();

        Sanctum::actingAs($chef);
        $types = collect($this->getJson('/api/notifications')->assertOk()->assertJsonPath('unread', 3)->json('notifications'))->pluck('type');
        $this->assertEqualsCanonicalizing(['task_late', 'project_high_risk', 'invitation_accepted'], $types->all());

        $this->postJson('/api/notifications/read')->assertOk();
        $this->getJson('/api/notifications')->assertJsonPath('unread', 0);

        Sanctum::actingAs($member);
        $this->getJson('/api/notifications')->assertOk()->assertJsonPath('notifications.0.type', 'task_late');

        Sanctum::actingAs($this->user('direction'));
        $types = collect($this->getJson('/api/notifications')->json('notifications'))->pluck('type');
        $this->assertTrue($types->contains('project_late_tasks'));
        $this->assertTrue($types->contains('project_high_risk'));
    }

    /* ---------------- Enterprise Health Score ---------------- */

    public function test_global_health_score_combines_projects_support_and_finance(): void
    {
        $director = $this->user('direction');
        Sanctum::actingAs($director);

        $this->getJson('/api/director/health-score')->assertOk()->assertJsonPath('score', null);

        $this->project($this->user('chef_de_projet'), ['risk_level' => 'Faible']);
        Ticket::create(['company_id' => $this->company->id, 'title' => 'T', 'description' => 'D', 'status' => 'resolved']);
        FinancialHealthReport::create([
            'company_id' => $this->company->id, 'user_id' => $director->id, 'health_score' => 80,
            'financial_health' => 'healthy', 'bankruptcy_probability' => 0.2, 'decision_threshold' => 0.5,
        ]);

        $res = $this->getJson('/api/director/health-score')->assertOk()->json();
        $this->assertSame(100, $res['components']['projects']['score']);
        $this->assertSame(80, $res['components']['finance']['score']);
        $this->assertNotNull($res['components']['support']['score']);
        $this->assertGreaterThan(0, $res['score']);
        $this->assertLessThanOrEqual(100, $res['score']);

        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->getJson('/api/director/health-score')->assertForbidden();
    }

    /* ---------------- Langue du profil ---------------- */

    public function test_locale_is_saved_on_profile(): void
    {
        $user = $this->user('chef_de_projet');
        Sanctum::actingAs($user);

        $this->putJson('/api/account/locale', ['locale' => 'ar'])->assertOk()->assertJsonPath('user.locale', 'ar');
        $this->putJson('/api/account/locale', ['locale' => 'de'])->assertStatus(422);
        $this->assertSame('ar', $user->fresh()->locale);
    }

    /* ---------------- Double authentification + audit ---------------- */

    public function test_two_factor_authentication_flow(): void
    {
        $director = $this->user('direction');
        $totp = app(TotpService::class);
        Sanctum::actingAs($director);

        $secret = $this->postJson('/api/account/2fa/setup')->assertOk()->json('secret');
        $this->postJson('/api/account/2fa/enable', ['code' => '000000'])->assertStatus(422);
        $this->postJson('/api/account/2fa/enable', ['code' => $totp->codeAt($secret, time())])
            ->assertOk()->assertJsonPath('user.two_factor_enabled', true)->assertJsonMissingPath('user.two_factor_secret');

        // Le login ne donne plus de token directement
        $this->app['auth']->forgetGuards();
        $login = $this->postJson('/api/login', ['email' => $director->email, 'password' => 'Password123!'])
            ->assertOk()->assertJsonPath('two_factor_required', true)->assertJsonMissingPath('token');

        $this->postJson('/api/auth/2fa/verify', ['challenge' => $login['challenge'], 'code' => '123456'])->assertStatus(422);
        $this->postJson('/api/auth/2fa/verify', ['challenge' => $login['challenge'], 'code' => $totp->codeAt($secret, time())])
            ->assertOk()->assertJsonStructure(['token', 'user']);
        // Challenge à usage unique
        $this->postJson('/api/auth/2fa/verify', ['challenge' => $login['challenge'], 'code' => $totp->codeAt($secret, time())])->assertStatus(422);

        Sanctum::actingAs($director->fresh());
        $this->postJson('/api/account/2fa/disable', ['password' => 'wrong', 'code' => $totp->codeAt($secret, time())])->assertStatus(422);
        $this->postJson('/api/account/2fa/disable', ['password' => 'Password123!', 'code' => $totp->codeAt($secret, time())])
            ->assertOk()->assertJsonPath('user.two_factor_enabled', false);

        $actions = AuditLog::where('user_id', $director->id)->pluck('action');
        foreach (['account.2fa_enabled', 'auth.2fa_failed', 'auth.login', 'account.2fa_disabled'] as $action) {
            $this->assertTrue($actions->contains($action), "audit manquant : {$action}");
        }
    }

    public function test_totp_matches_rfc_6238_reference_vector(): void
    {
        // Secret RFC 6238 "12345678901234567890" en Base32, T = 59 s -> 94287082 (8 chiffres) -> 287082 (6 chiffres)
        $this->assertSame('287082', app(TotpService::class)->codeAt('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59));
    }

    public function test_audit_log_is_reserved_to_direction(): void
    {
        $director = $this->user('direction');
        AuditLog::record($director, 'auth.login');
        AuditLog::record($director, 'project.created', ['project' => 'X']);

        Sanctum::actingAs($director);
        $this->getJson('/api/audit-logs')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/audit-logs?action=project')->assertOk()->assertJsonPath('total', 1);

        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->getJson('/api/audit-logs')->assertForbidden();
    }

    /* ---------------- Invitations ---------------- */

    public function test_invitations_resend_cancel_and_status(): void
    {
        $director = $this->user('direction');
        Sanctum::actingAs($director);

        $inv = $this->postJson('/api/invitations', ['email' => 'm@example.com', 'role' => 'membre_equipe', 'job_title' => 'Dev', 'locale' => 'en'])
            ->assertCreated()->json('invitation');
        $this->assertSame('Dev', $inv['job_title']);
        $this->assertSame('en', $inv['locale']);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'brevo') && $r['subject'] === 'Invitation to join NEXUS AI');

        $oldToken = Invitation::find($inv['id'])->token;
        $this->postJson("/api/invitations/{$inv['id']}/resend")->assertOk()->assertJsonPath('invitation.status', 'pending');
        $this->assertNotSame($oldToken, Invitation::find($inv['id'])->token);

        Invitation::find($inv['id'])->update(['expires_at' => now()->subDay()]);
        $this->getJson('/api/invitations')->assertJsonPath('0.status', 'expired');

        // Un chef ne peut pas gérer l'invitation de la direction
        Sanctum::actingAs($this->user('chef_de_projet'));
        $this->deleteJson("/api/invitations/{$inv['id']}")->assertForbidden();

        Sanctum::actingAs($director);
        $this->deleteJson("/api/invitations/{$inv['id']}")->assertOk();
        $this->assertNull(Invitation::find($inv['id']));
        $this->assertTrue(AuditLog::where('action', 'invitation.cancelled')->exists());
    }

    public function test_accepted_invitation_assigns_project_job_and_locale(): void
    {
        $chef = $this->user('chef_de_projet');
        $project = $this->project($chef);
        Invitation::create([
            'email' => 'joiner@example.com', 'role' => 'membre_equipe', 'job_title' => 'QA', 'project_id' => $project->id,
            'locale' => 'ar', 'token' => 'join-token', 'company_id' => $this->company->id,
            'invited_by' => $chef->id, 'expires_at' => now()->addDays(7),
        ]);
        VerificationCode::create(['email' => 'joiner@example.com', 'code' => '111111', 'expires_at' => now()->addMinutes(5)])
            ->forceFill(['verified_at' => now()])->save();

        $this->getJson('/api/invitations/validate/join-token')->assertJsonPath('locale', 'ar');

        $this->postJson('/api/register', [
            'first_name' => 'Jo', 'last_name' => 'Iner', 'email' => 'joiner@example.com',
            'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'invitation_token' => 'join-token',
        ])->assertCreated()->assertJsonPath('user.job_title', 'QA')->assertJsonPath('user.locale', 'ar');

        $this->assertTrue($project->team()->where('users.email', 'joiner@example.com')->exists());
    }

    /* ---------------- Bilans IA : historique + régénération automatique ---------------- */

    public function test_report_history_and_automatic_regeneration(): void
    {
        $chef = $this->user('chef_de_projet');
        $project = $this->project($chef);
        Sanctum::actingAs($chef);

        $this->postJson("/api/projects/{$project->id}/generate-report")->assertOk()->assertJsonPath('report.health', 'Moyenne');
        $this->getJson("/api/projects/{$project->id}/reports")->assertOk()->assertJsonCount(1)->assertJsonPath('0.trigger', 'manual');

        // Modifier une donnée du modèle relance le bilan après la réponse
        $this->putJson("/api/projects/{$project->id}", ['planned_effort' => 1400])
            ->assertOk()->assertJsonPath('ai_report_regenerating', true);

        $this->assertSame(2, ProjectReport::where('project_id', $project->id)->count());
        $this->assertSame('auto', ProjectReport::where('project_id', $project->id)->latest('id')->first()->trigger);

        // Un changement de nom seul ne relance rien
        $this->putJson("/api/projects/{$project->id}", ['name' => 'Renommé'])->assertJsonPath('ai_report_regenerating', false);
        $this->assertSame(2, ProjectReport::where('project_id', $project->id)->count());

        // La direction de la même entreprise peut consulter l'historique
        Sanctum::actingAs($this->user('direction'));
        $this->getJson("/api/projects/{$project->id}/reports")->assertOk()->assertJsonCount(2);
    }
}
