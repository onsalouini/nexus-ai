<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
<body style="font-family: sans-serif; color: #14151C;">
    <h2>{{ __('Vous êtes invité(e) sur NEXUS AI') }}</h2>
    <p>{{ __('Bonjour :name,', ['name' => $invitation->first_name ?? '']) }}</p>
    <p>{{ $intro }}</p>
    <p>
        <a href="{{ $link }}" style="background:#101114;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">
            {{ __('Créer mon compte') }}
        </a>
    </p>
    <p style="font-size:12px;color:#888;">{{ __('Ce lien expire dans 7 jours.') }}</p>
</body>
</html>
