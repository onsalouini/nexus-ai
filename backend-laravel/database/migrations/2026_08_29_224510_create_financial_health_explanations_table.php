<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('financial_health_explanations', function (Blueprint $table) {
    $table->id();

    $table->foreignId('financial_health_report_id')
        ->constrained('financial_health_reports')
        ->cascadeOnDelete();

    $table->string('feature');

    $table->decimal('shap_value', 15, 8);

    $table->enum('impact', [
        'increases_risk',
        'decreases_risk',
    ]);

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_health_explanations');
    }
};
