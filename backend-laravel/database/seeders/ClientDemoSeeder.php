<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/*
| Un client de démonstration par entreprise de démo (client{N}@nexus-demo.tn / Password123!),
| rattaché aux deux premiers projets, avec un ticket d'exemple. Idempotent.
|   php artisan db:seed --class=ClientDemoSeeder
*/
class ClientDemoSeeder extends Seeder
{
    public function run(): void
    {
        $directors = User::where('role', 'direction')->where('email', 'like', 'direction%@nexus-demo.tn')->get();

        foreach ($directors as $director) {
            if (! preg_match('/^direction(\d+)@/', $director->email, $m) || ! $director->company_id) {
                continue;
            }

            $client = User::updateOrCreate(
                ['email' => "client{$m[1]}@nexus-demo.tn"],
                [
                    'first_name' => 'Karim',
                    'last_name' => 'Client',
                    'password' => Hash::make('Password123!'),
                    'role' => 'client',
                    'company_id' => $director->company_id,
                    'job_title' => 'Client',
                    'avatar_color' => 'amber',
                    'email_verified_at' => now(),
                ]
            );

            $projects = Project::where('company_id', $director->company_id)->orderBy('id')->take(2)->get();
            $projects->each(fn (Project $p) => $p->update(['client_id' => $client->id]));

            if ($projects->isNotEmpty() && ! Ticket::where('created_by', $client->id)->exists()) {
                Ticket::create([
                    'company_id' => $director->company_id,
                    'created_by' => $client->id,
                    'project_id' => $projects->first()->id,
                    'title' => "Export PDF vide",
                    'description' => "Bonjour, l'export PDF du rapport mensuel génère un fichier vide depuis hier. Pouvez-vous regarder ? Merci.",
                    'customer_name' => 'Karim Client',
                    'customer_email' => $client->email,
                    'category' => 'bug',
                    'urgency' => 'medium',
                    'sentiment' => 'neutral',
                    'triage_source' => 'keywords',
                ]);
            }
        }
    }
}
