<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Explication du modèle ML (sensibilité locale + importance globale),
            // renvoyée par le service FastAPI au moment de la prédiction.
            $table->json('risk_explanation')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('risk_explanation');
        });
    }
};
