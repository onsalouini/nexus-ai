<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| Espace client (projets suivis + tickets avec fil de discussion),
| tri des tickets par modèle ML, notifications persistantes, alertes de risque
| projet / faillite avec seuils par entreprise, photo de profil stockée en base.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('triage_source', 20)->nullable();   // ml | groq | keywords
            $table->json('triage_confidence')->nullable();
        });

        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('severity', 10)->default('info'); // info | warning | critical
            $table->json('data')->nullable();
            $table->string('link')->nullable();
            // Évite les doublons pour les alertes recalculées (une tâche en retard = une notification)
            $table->string('dedupe_key', 120)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('emailed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'read_at']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->unsignedTinyInteger('risk_alert_threshold')->default(35);        // % de dépassement d'effort
            $table->unsignedTinyInteger('bankruptcy_alert_threshold')->default(50);  // % de probabilité de faillite
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_color', 20)->nullable();
            $table->boolean('email_alerts')->default(true);
        });

        // Photo de profil en base : survit aux redéploiements (disque Render éphémère)
        Schema::create('user_avatars', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('mime', 40);
            $table->string('hash', 40);
            $table->timestamps();
        });
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE user_avatars ADD data MEDIUMBLOB NOT NULL');
        } else {
            Schema::table('user_avatars', fn (Blueprint $table) => $table->binary('data'));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_avatars');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['avatar_color', 'email_alerts']));
        Schema::table('companies', fn (Blueprint $t) => $t->dropColumn(['risk_alert_threshold', 'bankruptcy_alert_threshold']));
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('ticket_messages');
        Schema::table('tickets', function (Blueprint $t) {
            $t->dropConstrainedForeignId('project_id');
            $t->dropColumn(['triage_source', 'triage_confidence']);
        });
        Schema::table('projects', fn (Blueprint $t) => $t->dropConstrainedForeignId('client_id'));
    }
};
