<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RiskPredictionService
{
    /**
     * L'application manipule le facteur d'ajustement comme un multiplicateur
     * (VAF, 0.5 à 1.5 : 0.65 simple, 1 standard, 1.35 complexe).
     *
     * Le modèle ML, lui, a été entraîné sur le degré d'influence (TDI, 0 à 70)
     * et recalcule VAF = 0.65 + 0.01 × TDI côté FastAPI.
     * Envoyer 1 au lieu de 35 rendait cette variable quasi constante :
     * il faut donc convertir avant d'appeler le service.
     */
    private function vafToInfluence(float $vaf): float
    {
        return max(0.0, min(70.0, round(($vaf - 0.65) / 0.01, 1)));
    }

    /**
     * Vérifie que le service FastAPI répond et que le modèle est chargé.
     */
    public function isOnline(): bool
    {
        try {
            $response = Http::timeout(5)
                ->withOptions(['verify' => false])
                ->get(config('services.ai.url') . '/health');

            return $response->successful()
                && (bool) $response->json('model_loaded');
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function predict(array $data): ?array
    {
        try {
            $response = Http::timeout(60)
    ->withOptions(['verify' => false])
    ->post(config('services.ai.url') . '/predict-risk', [
                    'team_exp' => $data['team_exp'],
                    'manager_exp' => $data['manager_exp'],
                    'length' => $data['length'],
                    'transactions' => $data['transactions'],
                    'entities' => $data['entities'],
                    'points_non_adjust' => $data['points_non_adjust'],
                    'adjustment' => $this->vafToInfluence((float) $data['adjustment']),
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
