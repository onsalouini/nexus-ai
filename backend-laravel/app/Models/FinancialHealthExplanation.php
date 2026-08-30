<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialHealthExplanation extends Model
{
    use HasFactory;

    protected $fillable = [
        'financial_health_report_id',
        'feature',
        'shap_value',
        'impact',
    ];

    protected $casts = [
        'shap_value' => 'float',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(FinancialHealthReport::class);
    }
}
