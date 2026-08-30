<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialHealthIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'financial_health_report_id',
        'current_ratio',
        'cash_total_assets',
        'roa_before_interest_depreciation',
        'operating_profit_rate',
        'debt_ratio',
        'net_worth_assets',
        'working_capital_total_assets',
        'net_income_total_assets',
        'total_asset_turnover',
        'retained_earnings_total_assets',
        'interest_coverage_ratio',
        'equity_liability',
        'cash_flow_total_assets',
    ];

    protected $casts = [
        'current_ratio' => 'float',
        'cash_total_assets' => 'float',
        'roa_before_interest_depreciation' => 'float',
        'operating_profit_rate' => 'float',
        'debt_ratio' => 'float',
        'net_worth_assets' => 'float',
        'working_capital_total_assets' => 'float',
        'net_income_total_assets' => 'float',
        'total_asset_turnover' => 'float',
        'retained_earnings_total_assets' => 'float',
        'interest_coverage_ratio' => 'float',
        'equity_liability' => 'float',
        'cash_flow_total_assets' => 'float',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(FinancialHealthReport::class);
    }
}
