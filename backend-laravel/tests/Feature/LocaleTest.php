<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    private function badLogin(string $language)
    {
        return $this->withHeader('Accept-Language', $language)
            ->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'wrong']);
    }

    public function test_api_messages_follow_accept_language(): void
    {
        $this->badLogin('fr')->assertStatus(401)->assertJson(['message' => 'Identifiants incorrects.']);
        $this->badLogin('en')->assertStatus(401)->assertJson(['message' => 'Invalid credentials.']);
        $this->badLogin('ar')->assertStatus(401)->assertJson(['message' => 'بيانات الدخول غير صحيحة.']);
    }

    public function test_unknown_language_falls_back_to_french(): void
    {
        $this->badLogin('de')->assertStatus(401)->assertJson(['message' => 'Identifiants incorrects.']);
    }

    public function test_validation_errors_are_translated(): void
    {
        $this->withHeader('Accept-Language', 'fr')
            ->postJson('/api/login', [])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Le champ email est obligatoire.');

        $this->withHeader('Accept-Language', 'ar')
            ->postJson('/api/login', [])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'حقل البريد الإلكتروني مطلوب.');
    }
}
