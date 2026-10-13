<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
<body style="font-family: sans-serif; color: #14151C;">
    <div style="max-width:560px;margin:0 auto;border:1px solid #f1c4c4;border-radius:12px;overflow:hidden;">
        <div style="background:#b91c1c;color:#fff;padding:14px 20px;font-weight:bold;">⚠ {{ $subject }}</div>
        <div style="padding:20px;">
            <p>{{ __('Bonjour :name,', ['name' => $user->first_name]) }}</p>
            <p style="line-height:1.6;">{{ $message }}</p>
            <p>
                <a href="{{ $link }}" style="background:#101114;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                    {{ __('Voir dans NEXUS AI') }}
                </a>
            </p>
            <p style="font-size:12px;color:#888;">{{ __('Vous recevez cet email car les alertes par email sont activées dans vos paramètres.') }}</p>
        </div>
    </div>
</body>
</html>
