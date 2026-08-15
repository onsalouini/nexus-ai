<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background:#030712; color:#fff; padding:32px;">
    <div style="max-width:420px;margin:auto;background:#070D1C;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;text-align:center;">
        <p style="font-size:12px;letter-spacing:2px;color:#67E8F9;text-transform:uppercase;">Vérification d'email</p>
        <h2 style="margin:8px 0 20px;">Bonjour {{ $firstName ?: '' }}</h2>
        <p style="color:#94A3B8;font-size:14px;">Voici votre code de vérification NEXUS AI :</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:linear-gradient(90deg,#22D3EE,#3B82F6,#8B5CF6);-webkit-background-clip:text;color:transparent;margin:20px 0;">
            {{ $code }}
        </div>
        <p style="color:#64748B;font-size:12px;">Ce code expire dans 15 minutes. Ne le partagez avec personne.</p>
    </div>
</body>
</html>