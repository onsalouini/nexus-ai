<?php

namespace App\Support;

use Illuminate\Support\Facades\App;

/*
| Consigne de langue injectée dans les prompts Groq,
| pour que l'IA réponde dans la langue de l'interface.
*/
class AiLanguage
{
    private const INSTRUCTIONS = [
        'fr' => 'Réponds toujours en français.',
        'en' => 'Always answer in English (every free-text field must be written in English).',
        'ar' => 'أجب دائمًا باللغة العربية الفصحى (Always answer in Modern Standard Arabic; every free-text field must be written in Arabic).',
    ];

    public static function instruction(): string
    {
        return self::INSTRUCTIONS[App::getLocale()] ?? self::INSTRUCTIONS['fr'];
    }
}
