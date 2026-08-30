<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_health_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Résultat du modèle IA
            $table->decimal('health_score', 5, 2);
            $table->string('financial_health');
            $table->decimal('bankruptcy_probability', 8, 6);
            $table->decimal('decision_threshold', 8, 6);

            // Résultat généré par Groq
            $table->text('ai_analysis')->nullable();
            $table->json('ai_recommendations')->nullable();

            // Version du modèle utilisée
            $table->string('model_version')->nullable();

            $table->timestamps();

            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_health_reports');
    }
};
