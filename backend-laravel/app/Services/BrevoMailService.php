<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class BrevoMailService
{
    public function send(
        string $to,
        string $subject,
        string $htmlContent,
        ?string $toName = null
    ): array {
        $response = Http::withHeaders([
            'accept' => 'application/json',
            'api-key' => config('services.brevo.api_key'),
            'content-type' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', [
            'sender' => [
                'name' => config('services.brevo.sender_name'),
                'email' => config('services.brevo.sender_email'),
            ],
            'to' => [
                [
                    'email' => $to,
                    'name' => $toName,
                ],
            ],
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Brevo API error: ' . $response->body()
            );
        }

        return $response->json();
    }
}