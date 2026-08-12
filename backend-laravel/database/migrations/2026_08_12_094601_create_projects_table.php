<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chef_de_projet_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('planifie'); // planifie | en_cours | termine

            // Champs pour le modele IA (Module 1 - Risque projet)
            $table->float('team_exp')->comment('Experience moyenne de l equipe, en annees');
            $table->float('manager_exp')->comment('Experience du chef de projet, en annees');
            $table->float('length')->comment('Duree prevue du projet, en mois');
            $table->float('transactions')->comment('Nombre de transactions du systeme');
            $table->float('entities')->comment('Nombre d entites de donnees');
            $table->float('points_non_adjust')->comment('Points de fonction bruts');
            $table->float('adjustment')->default(1)->comment('Facteur d ajustement technique');
            $table->float('points_adjust')->nullable()->comment('Points de fonction ajustes');
            $table->integer('language')->default(1)->comment('Langage/techno, code numerique');
            $table->float('planned_effort')->comment('Budget d effort prevu, en heures');

            // Resultat du modele IA, rempli en Module 2
            $table->float('predicted_effort')->nullable();
            $table->integer('risk_score')->nullable();
            $table->string('risk_level')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};