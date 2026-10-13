<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| Contrôle périodique des alertes (retards, échéances, tickets critiques, risques)
| pour tous les utilisateurs. Planifié toutes les heures (php artisan schedule:work / cron).
| Les mêmes contrôles s'exécutent aussi à la consultation des notifications.
*/
Artisan::command('nexus:scan-alerts', function (\App\Services\NotificationService $notifications, \App\Services\RiskAlertService $alerts) {
    \App\Models\Project::whereNotNull('risk_level')->where('status', '!=', 'termine')->each(fn ($p) => $alerts->checkProject($p, email: false));
    \App\Models\User::whereNotNull('company_id')->each(fn ($u) => $notifications->scan($u, true));
    $this->info('Alertes contrôlées.');
})->purpose('Génère les notifications et alertes de risque');

\Illuminate\Support\Facades\Schedule::command('nexus:scan-alerts')->hourly();
