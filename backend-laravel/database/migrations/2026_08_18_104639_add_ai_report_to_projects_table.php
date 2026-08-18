<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('ai_report')->nullable()->after('risk_level');
            $table->timestamp('ai_report_generated_at')->nullable()->after('ai_report');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'ai_report',
                'ai_report_generated_at',
            ]);
        });
    }
};