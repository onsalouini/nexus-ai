<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #14151C;">
    <h2>Vous êtes invité(e) sur NEXUS AI</h2>
    <p>Bonjour {{ $invitation->first_name ?? '' }},</p>
    <p>{{ $intro }}</p>
    <p>
        <a href="{{ $link }}" style="background:#101114;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Créer mon compte
        </a>
    </p>
    <p style="font-size:12px;color:#888;">Ce lien expire dans 7 jours.</p>
</body>
</html>