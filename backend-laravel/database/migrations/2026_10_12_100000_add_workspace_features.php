<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Fonctionnalités : langue du profil, notifications, double authentification,
| journal d'audit, tickets support, historique des bilans IA.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 5)->nullable();
            $table->timestamp('notifications_read_at')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->timestamp('two_factor_enabled_at')->nullable();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->string('locale', 5)->nullable();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60);
            $table->json('meta')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();
            $table->index(['company_id', 'created_at']);
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('category', 20)->default('other');   // bug | billing | feature | account | other
            $table->string('urgency', 20)->default('medium');   // low | medium | high | critical
            $table->string('sentiment', 20)->default('neutral'); // negative | neutral | positive
            $table->string('status', 20)->default('open');      // open | in_progress | resolved | closed
            $table->boolean('classification_corrected')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'status']);
        });

        Schema::create('project_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('trigger', 20)->default('manual'); // manual | auto
            $table->json('report');
            $table->float('planned_effort')->nullable();
            $table->float('predicted_effort')->nullable();
            $table->string('risk_level')->nullable();
            $table->float('risk_score')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_reports');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('audit_logs');
        Schema::table('invitations', fn (Blueprint $t) => $t->dropColumn('locale'));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn([
            'locale', 'notifications_read_at', 'two_factor_secret', 'two_factor_enabled_at',
        ]));
    }
};
