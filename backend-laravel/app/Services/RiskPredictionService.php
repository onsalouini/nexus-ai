<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RiskPredictionService
{
    public function predict(array $data): ?array
    {
        try {
            $response = Http::timeout(60)
    ->post(config('services.ai.url') . '/predict-risk', [
                    'team_exp' => $data['team_exp'],
                    'manager_exp' => $data['manager_exp'],
                    'length' => $data['length'],
                    'transactions' => $data['transactions'],
                    'entities' => $data['entities'],
                    'points_non_adjust' => $data['points_non_adjust'],
                    'adjustment' => $data['adjustment'],
                    'language' => $data['language'],
                    'planned_effort' => $data['planned_effort'],
                ]);

            if ($response->failed()) {
                Log::error('Risk service error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            return $response->json();

        } catch (\Throwable $e) {
            Log::error('Risk service unavailable', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
