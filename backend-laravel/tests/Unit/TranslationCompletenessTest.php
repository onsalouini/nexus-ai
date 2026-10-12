<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/* Chaque chaîne __('...') du backend (source : français) doit exister en anglais et en arabe. */
class TranslationCompletenessTest extends TestCase
{
    public function test_every_translated_string_exists_in_en_and_ar(): void
    {
        $root = dirname(__DIR__, 2);
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root . '/app'));
        $paths = array_merge(
            iterator_to_array($files),
            glob($root . '/resources/views/emails/*.php') ?: []
        );

        $keys = [];
        foreach ($paths as $file) {
            $path = (string) $file;
            if (! str_ends_with($path, '.php')) {
                continue;
            }
            preg_match_all("/__\(\s*(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\")/", file_get_contents($path), $matches, PREG_SET_ORDER);
            foreach ($matches as $m) {
                $keys[] = stripslashes(($m[1] ?? '') !== '' ? $m[1] : ($m[2] ?? ''));
            }
        }

        $this->assertNotEmpty($keys);

        foreach (['en', 'ar'] as $locale) {
            $dictionary = json_decode(file_get_contents("{$root}/lang/{$locale}.json"), true);
            $missing = array_values(array_diff(array_unique($keys), array_keys($dictionary)));
            $this->assertSame([], $missing, "Traductions manquantes dans lang/{$locale}.json");
        }
    }
}
