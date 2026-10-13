<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'industry',
        'employees_count',
        'risk_alert_threshold',
        'bankruptcy_alert_threshold',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
    public function financialHealthReports(): HasMany
{
    return $this->hasMany(FinancialHealthReport::class);
}
}
