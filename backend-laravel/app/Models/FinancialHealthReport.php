<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialHealthReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'health_score',
        'financial_health',
        'bankruptcy_probability',
        'decision_threshold',
        'ai_analysis',
        'ai_recommendations',
        'model_version',
    ];

    protected $casts = [
        'health_score' => 'float',
        'bankruptcy_probability' => 'float',
        'decision_threshold' => 'float',
        'ai_recommendations' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function indicators(): HasOne
    {
        return $this->hasOne(FinancialHealthIndicator::class);
    }

    public function explanations(): HasMany
    {
        return $this->hasMany(FinancialHealthExplanation::class);
    }
}
