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
        Schema::create('financial_health_indicators', function (Blueprint $table) {
    $table->id();

    $table->foreignId('financial_health_report_id')
        ->constrained('financial_health_reports')
        ->cascadeOnDelete();

    $table->decimal('current_ratio', 15, 6);
    $table->decimal('cash_total_assets', 15, 6);
    $table->decimal('roa_before_interest_depreciation', 15, 6);
    $table->decimal('operating_profit_rate', 15, 6);
    $table->decimal('debt_ratio', 15, 6);
    $table->decimal('net_worth_assets', 15, 6);
    $table->decimal('working_capital_total_assets', 15, 6);
    $table->decimal('net_income_total_assets', 15, 6);
    $table->decimal('total_asset_turnover', 15, 6);
    $table->decimal('retained_earnings_total_assets', 15, 6);
    $table->decimal('interest_coverage_ratio', 15, 6);
    $table->decimal('equity_liability', 15, 6);
    $table->decimal('cash_flow_total_assets', 15, 6);

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_health_indicators');
    }
};
