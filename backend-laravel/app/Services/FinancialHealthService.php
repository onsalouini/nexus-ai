<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class FinancialHealthService
{
    protected string $aiUrl;

    public function __construct()
    {
        $this->aiUrl = env(
            'FINANCIAL_AI_URL',
            'http://127.0.0.1:8002'
        );
    }

    public function predict(array $financialData): array
    {
        $response = Http::timeout(60)
            ->post(
                $this->aiUrl . '/predict',
                $financialData
            );

        if (!$response->successful()) {
            throw new Exception(
                'Financial AI service error: ' .
                $response->body()
            );
        }

        return $response->json();
    }

    public function explain(array $financialData): array
    {
        $response = Http::timeout(60)
            ->post(
                $this->aiUrl . '/explain',
                $financialData
            );

        if (!$response->successful()) {
            throw new Exception(
                'Financial AI explanation error: ' .
                $response->body()
            );
        }

        return $response->json();
    }
}
