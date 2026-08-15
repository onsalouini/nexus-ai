<?php

namespace App\Services;

use App\Models\VerificationCode;
use Illuminate\Support\Str;

class VerificationCodeService
{
    public function generateAndSend(string $email, string $firstName = ''): void
    {
        $code = (string) random_int(100000, 999999);

        VerificationCode::create([
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);

        $html = view('emails.verification-code', [
            'code' => $code,
            'firstName' => $firstName,
        ])->render();

        app(BrevoMailService::class)->send(
            $email,
            'Votre code de vérification NEXUS AI',
            $html,
            $firstName
        );
    }

    public function verify(string $email, string $code): bool
    {
        $record = VerificationCode::where('email', $email)
            ->where('code', $code)
            ->latest()
            ->first();

        if (!$record || !$record->isValid()) {
            return false;
        }

        $record->update(['verified_at' => now()]);
        return true;
    }
}
