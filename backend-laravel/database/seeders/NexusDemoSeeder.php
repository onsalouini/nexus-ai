<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NexusDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            /*
            |--------------------------------------------------------------------------
            | 1. ENTREPRISES TUNISIENNES FICTIVES
            |--------------------------------------------------------------------------
            */

            $companies = [
                [
                    'name' => 'Carthage Digital',
                    'email' => 'contact@carthage-digital.tn',
                    'phone' => '+216 71 245 810',
                    'address' => 'Centre Urbain Nord, Tunis',
                    'industry' => 'Technologie',
                ],
                [
                    'name' => 'Jasmin Solutions',
                    'email' => 'contact@jasmin-solutions.tn',
                    'phone' => '+216 71 328 450',
                    'address' => 'Ariana Centre, Ariana',
                    'industry' => 'SaaS',
                ],
                [
                    'name' => 'Ifriqiya Data Lab',
                    'email' => 'contact@ifriqiya-data.tn',
                    'phone' => '+216 73 421 650',
                    'address' => 'Les Jardins de Sousse, Sousse',
                    'industry' => 'Data & IA',
                ],
                [
                    'name' => 'Byrsa Technologies',
                    'email' => 'contact@byrsa-tech.tn',
                    'phone' => '+216 74 215 730',
                    'address' => 'Centre Ville, Sfax',
                    'industry' => 'Fintech',
                ],
                [
                    'name' => 'Medina Software',
                    'email' => 'contact@medina-software.tn',
                    'phone' => '+216 71 563 920',
                    'address' => 'Lac 2, Tunis',
                    'industry' => 'Développement logiciel',
                ],
                [
                    'name' => 'Cap Bon Innovation',
                    'email' => 'contact@capbon-innovation.tn',
                    'phone' => '+216 72 285 640',
                    'address' => 'Nabeul Centre, Nabeul',
                    'industry' => 'E-commerce',
                ],
                [
                    'name' => 'Sahel Tech',
                    'email' => 'contact@sahel-tech.tn',
                    'phone' => '+216 73 612 480',
                    'address' => 'Sahloul, Sousse',
                    'industry' => 'Logistique',
                ],
                [
                    'name' => 'Kairouan Digital',
                    'email' => 'contact@kairouan-digital.tn',
                    'phone' => '+216 77 231 590',
                    'address' => 'Centre Ville, Kairouan',
                    'industry' => 'Services numériques',
                ],
                [
                    'name' => 'Gabès Innovation',
                    'email' => 'contact@gabes-innovation.tn',
                    'phone' => '+216 75 294 610',
                    'address' => 'Centre Ville, Gabès',
                    'industry' => 'Industrie & Technologie',
                ],
                [
                    'name' => 'Djerba Digital',
                    'email' => 'contact@djerba-digital.tn',
                    'phone' => '+216 75 730 420',
                    'address' => 'Midoun, Djerba',
                    'industry' => 'Tourisme & Technologie',
                ],
            ];

            /*
            |--------------------------------------------------------------------------
            | 2. NOMS TUNISIENS
            |--------------------------------------------------------------------------
            */

            $firstNames = [
                'Mohamed',
                'Ahmed',
                'Yassine',
                'Amine',
                'Aymen',
                'Oussama',
                'Sami',
                'Fares',
                'Malek',
                'Nour',
                'Sarra',
                'Mariem',
                'Ines',
                'Aya',
                'Meriem',
                'Hela',
                'Rania',
                'Dorsaf',
                'Emna',
                'Asma',
                'Youssef',
                'Anis',
                'Bilel',
                'Wassim',
                'Seif',
                'Karim',
                'Hamza',
                'Slim',
                'Moez',
                'Walid',
            ];

            $lastNames = [
                'Ben Salah',
                'Trabelsi',
                'Ben Amor',
                'Jlassi',
                'Mansouri',
                'Gharbi',
                'Bouazizi',
                'Mejri',
                'Ayari',
                'Khelifi',
                'Dridi',
                'Chaabane',
                'Mrad',
                'Tlili',
                'Ben Youssef',
                'Hamdi',
                'Saidi',
                'Kammoun',
                'Baccouche',
                'Masmoudi',
                'Hammami',
                'Ben Romdhane',
                'Cherif',
                'Zouari',
                'Ferchichi',
                'Mahjoub',
                'Sassi',
                'Jebali',
                'Karray',
                'Missaoui',
            ];

            $jobTitles = [
                'Développeur Full Stack',
                'Développeuse Full Stack',
                'Data Scientist',
                'Data Analyst',
                'Ingénieur IA',
                'Ingénieure IA',
                'Développeur Backend',
                'Développeuse Frontend',
                'UX/UI Designer',
                'Ingénieur DevOps',
                'Ingénieure DevOps',
                'QA Engineer',
                'Business Analyst',
                'Ingénieur Machine Learning',
                'Product Designer',
            ];

            /*
            |--------------------------------------------------------------------------
            | 3. MOT DE PASSE DEMO
            |--------------------------------------------------------------------------
            */

            $password = Hash::make('Password123!');

            /*
            |--------------------------------------------------------------------------
            | 4. CRÉATION DES 10 ENTREPRISES
            |--------------------------------------------------------------------------
            */

            foreach ($companies as $companyIndex => $companyData) {

                $companyNumber = $companyIndex + 1;

                $company = Company::updateOrCreate(
                    [
                        'email' => $companyData['email'],
                    ],
                    [
                        'name' => $companyData['name'],
                        'phone' => $companyData['phone'],
                        'address' => $companyData['address'],
                        'industry' => $companyData['industry'],
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | 5. DIRECTEUR
                |--------------------------------------------------------------------------
                */

                $directorFirstName = $firstNames[$companyIndex];
                $directorLastName = $lastNames[$companyIndex];

                $directorEmail = "direction{$companyNumber}@nexus-demo.tn";

                $director = User::updateOrCreate(
                    [
                        'email' => $directorEmail,
                    ],
                    [
                        'first_name' => $directorFirstName,
                        'last_name' => $directorLastName,
                        'password' => $password,
                        'role' => 'direction',
                        'company_id' => $company->id,
                        'manager_id' => null,
                        'job_title' => 'Directeur Général',
                        'avatar_path' => null,
                        'cv_path' => null,
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | 6. 5 CHEFS DE PROJET PAR ENTREPRISE
                |--------------------------------------------------------------------------
                */

                for ($chefIndex = 1; $chefIndex <= 5; $chefIndex++) {

                    $nameIndex = (
                        ($companyIndex * 5) + ($chefIndex - 1)
                    ) % count($firstNames);

                    $chefFirstName = $firstNames[$nameIndex];

                    $lastNameIndex = (
                        ($companyIndex * 5) + $chefIndex
                    ) % count($lastNames);

                    $chefLastName = $lastNames[$lastNameIndex];

                    $chefEmail =
                        "chef{$chefIndex}.entreprise{$companyNumber}@nexus-demo.tn";

                    $chef = User::updateOrCreate(
                        [
                            'email' => $chefEmail,
                        ],
                        [
                            'first_name' => $chefFirstName,
                            'last_name' => $chefLastName,
                            'password' => $password,
                            'role' => 'chef_de_projet',
                            'company_id' => $company->id,
                            'manager_id' => $director->id,
                            'job_title' => 'Chef de Projet',
                            'avatar_path' => null,
                            'cv_path' => null,
                        ]
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | 7. EMPLOYÉS
                    |--------------------------------------------------------------------------
                    |
                    | Chaque chef possède un nombre différent d'employés :
                    |
                    | Chef 1 -> 3
                    | Chef 2 -> 4
                    | Chef 3 -> 5
                    | Chef 4 -> 6
                    | Chef 5 -> 7
                    |
                    */

                    $employeeCount = $chefIndex + 2;

                    $employees = [];

                    for ($employeeIndex = 1; $employeeIndex <= $employeeCount; $employeeIndex++) {

                        $globalEmployeeIndex =
                            (($companyIndex * 25) + ($chefIndex * 7) + $employeeIndex)
                            % count($firstNames);

                        $employeeFirstName =
                            $firstNames[$globalEmployeeIndex];

                        $employeeLastName =
                            $lastNames[
                                ($globalEmployeeIndex + $employeeIndex)
                                % count($lastNames)
                            ];

                        $employeeEmail =
                            "employe{$employeeIndex}.chef{$chefIndex}.entreprise{$companyNumber}@nexus-demo.tn";

                        $jobTitle =
                            $jobTitles[
                                ($globalEmployeeIndex + $employeeIndex)
                                % count($jobTitles)
                            ];

                        $employee = User::updateOrCreate(
                            [
                                'email' => $employeeEmail,
                            ],
                            [
                                'first_name' => $employeeFirstName,
                                'last_name' => $employeeLastName,
                                'password' => $password,
                                'role' => 'agent_support',
                                'company_id' => $company->id,
                                'manager_id' => $chef->id,
                                'job_title' => $jobTitle,
                                'avatar_path' => null,
                                'cv_path' => null,
                            ]
                        );

                        $employees[] = $employee;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | 8. PROJETS DU CHEF
                    |--------------------------------------------------------------------------
                    */

                    $projectNames = [
                        'Plateforme de gestion intelligente',
                        'Système de suivi client',
                    ];

                    foreach ($projectNames as $projectIndex => $projectName) {

                        $projectNumber = $projectIndex + 1;

                        $project = Project::updateOrCreate(
                            [
                                'company_id' => $company->id,
                                'chef_de_projet_id' => $chef->id,
                                'name' => "{$projectName} - {$company->name}",
                            ],
                            [
                                'description' =>
                                    "Projet digital développé par {$company->name} sous la direction de {$chefFirstName} {$chefLastName}.",

                                'status' => match ($projectIndex) {
                                    0 => 'en_cours',
                                    1 => 'planifie',
                                    default => 'planifie',
                                },

                                /*
                                | Données utilisées par le modèle IA
                                */

                                'team_exp' =>
                                    round(2.5 + ($chefIndex * 0.7), 1),

                                'manager_exp' =>
                                    round(4.0 + ($companyIndex * 0.4), 1),

                                'length' =>
                                    3 + $projectIndex + $chefIndex,

                                'transactions' =>
                                    120 + ($companyIndex * 40) + ($chefIndex * 25),

                                'entities' =>
                                    8 + ($chefIndex * 2),

                                'points_non_adjust' =>
                                    120 + ($companyIndex * 15) + ($projectIndex * 20),

                                'adjustment' =>
                                    0.85 + ($projectIndex * 0.05),

                                'points_adjust' =>
                                    round(
                                        (120 + ($companyIndex * 15) + ($projectIndex * 20))
                                        *
                                        (0.85 + ($projectIndex * 0.05)),
                                        2
                                    ),

                                'language' =>
                                    $projectIndex === 0 ? 1 : 2,

                                'planned_effort' =>
                                    450 + ($chefIndex * 80) + ($projectIndex * 100),

                                'predicted_effort' =>
                                    480 + ($chefIndex * 75) + ($projectIndex * 110),

                                'risk_score' =>
                                    20 + ($companyIndex * 3) + ($chefIndex * 2),

                                'risk_level' =>
                                    ($companyIndex + $chefIndex) % 3 === 0
                                        ? 'eleve'
                                        : (($companyIndex + $chefIndex) % 3 === 1
                                            ? 'moyen'
                                            : 'faible'),
                            ]
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | 9. MEMBRES DU PROJET
                        |--------------------------------------------------------------------------
                        */

                        $teamIds = collect($employees)
                            ->shuffle()
                            ->take(min(count($employees), 4))
                            ->pluck('id')
                            ->push($chef->id)
                            ->unique()
                            ->values()
                            ->all();

                        $project->team()->sync($teamIds);
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | 10. NOMBRE TOTAL D'EMPLOYÉS
                |--------------------------------------------------------------------------
                */

                $company->update([
                    'employees_count' => User::where('company_id', $company->id)
                        ->whereIn('role', [
                            'chef_de_projet',
                            'agent_support',
                        ])
                        ->count(),
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | FIN
            |--------------------------------------------------------------------------
            */

            $this->command->info('');
            $this->command->info('🇹🇳 NEXUS AI — Demo tunisienne créée avec succès.');
            $this->command->info('');
            $this->command->info('10 entreprises');
            $this->command->info('10 directeurs');
            $this->command->info('50 chefs de projet');
            $this->command->info('Employés avec hiérarchie manager_id');
            $this->command->info('Projets + équipes + données IA');
            $this->command->info('');
            $this->command->info('🔐 Mot de passe demo : Password123!');
            $this->command->info('');
        });
    }
}