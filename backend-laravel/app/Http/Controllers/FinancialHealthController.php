<?php

namespace App\Http\Controllers;

use App\Services\FinancialHealthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;
use App\Models\FinancialHealthReport;
use App\Models\FinancialHealthIndicator;
use App\Models\FinancialHealthExplanation;
use Illuminate\Support\Facades\DB;

class FinancialHealthController extends Controller
{
    /**
     * ============================================================
     * PRÉDICTION
     * ============================================================
     *
     * Logique existante conservée.
     */
    public function predict(
        Request $request,
        FinancialHealthService $financialHealthService
    ): JsonResponse {

        $validated = $request->validate([
            'current_ratio' => 'required|numeric',
            'cash_total_assets' => 'required|numeric',
            'roa_before_interest_depreciation' => 'required|numeric',
            'operating_profit_rate' => 'required|numeric',
            'debt_ratio' => 'required|numeric',
            'net_worth_assets' => 'required|numeric',
            'working_capital_total_assets' => 'required|numeric',
            'net_income_total_assets' => 'required|numeric',
            'total_asset_turnover' => 'required|numeric',
            'retained_earnings_total_assets' => 'required|numeric',
            'interest_coverage_ratio' => 'required|numeric',
            'equity_liability' => 'required|numeric',
            'cash_flow_total_assets' => 'required|numeric',
        ]);

        try {

            $result = $financialHealthService->predict(
                $validated
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * ============================================================
     * SAUVEGARDE DU RAPPORT FINANCIER
     * ============================================================
     *
     * On conserve les résultats déjà calculés par le modèle :
     * - prediction
     * - financial_health
     * - bankruptcy_probability
     * - decision_threshold
     * - SHAP
     * - 13 indicateurs financiers
     *
     * Le company_id est récupéré automatiquement depuis
     * l'utilisateur connecté.
     */
    public function store(
        Request $request
    ): JsonResponse {

        $validated = $request->validate([

            'financial_data' => 'required|array',

            'financial_data.current_ratio' => 'required|numeric',
            'financial_data.cash_total_assets' => 'required|numeric',
            'financial_data.roa_before_interest_depreciation' => 'required|numeric',
            'financial_data.operating_profit_rate' => 'required|numeric',
            'financial_data.debt_ratio' => 'required|numeric',
            'financial_data.net_worth_assets' => 'required|numeric',
            'financial_data.working_capital_total_assets' => 'required|numeric',
            'financial_data.net_income_total_assets' => 'required|numeric',
            'financial_data.total_asset_turnover' => 'required|numeric',
            'financial_data.retained_earnings_total_assets' => 'required|numeric',
            'financial_data.interest_coverage_ratio' => 'required|numeric',
            'financial_data.equity_liability' => 'required|numeric',
            'financial_data.cash_flow_total_assets' => 'required|numeric',

            'prediction' => 'required|integer',

            'financial_health' => 'required|string|in:healthy,at_risk',

            'bankruptcy_probability' => 'required|numeric|min:0|max:1',

            'decision_threshold' => 'required|numeric|min:0|max:1',

            'explanations' => 'nullable|array',

            'explanations.*.feature' => 'required|string',

            'explanations.*.shap_value' => 'required|numeric',

            'explanations.*.impact' => 'required|string|in:increases_risk,decreases_risk',
        ]);

        try {

            /*
             * --------------------------------------------------------
             * UTILISATEUR CONNECTÉ
             * --------------------------------------------------------
             */

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié.',
                ], 401);
            }

            /*
             * --------------------------------------------------------
             * ENTREPRISE DE L'UTILISATEUR
             * --------------------------------------------------------
             */

            $companyId = $user->company_id;

            if (!$companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune entreprise associée à cet utilisateur.',
                ], 422);
            }

            /*
             * --------------------------------------------------------
             * CALCUL DU SCORE
             * --------------------------------------------------------
             *
             * On conserve exactement la logique existante :
             *
             * score = (1 - probabilité de faillite) × 100
             */

            $bankruptcyProbability =
                (float) $validated['bankruptcy_probability'];

            $healthScore = round(
                (1 - $bankruptcyProbability) * 100,
                2
            );

            /*
             * --------------------------------------------------------
             * TRANSACTION
             * --------------------------------------------------------
             */

            $report = DB::transaction(function () use (
                $validated,
                $user,
                $companyId,
                $healthScore
            ) {

                /*
                 * 1. Rapport principal
                 */

                $report = FinancialHealthReport::create([

                    'company_id' => $companyId,

                    'user_id' => $user->id,

                    'health_score' => $healthScore,

                    'financial_health' =>
                        $validated['financial_health'],

                    'bankruptcy_probability' =>
                        $validated['bankruptcy_probability'],

                    'decision_threshold' =>
                        $validated['decision_threshold'],

                    'model_version' => '1.0.0',
                ]);


                /*
                 * 2. Les 13 indicateurs financiers
                 */

                FinancialHealthIndicator::create([

                    'financial_health_report_id' =>
                        $report->id,

                    'current_ratio' =>
                        $validated['financial_data']['current_ratio'],

                    'cash_total_assets' =>
                        $validated['financial_data']['cash_total_assets'],

                    'roa_before_interest_depreciation' =>
                        $validated['financial_data']
                            ['roa_before_interest_depreciation'],

                    'operating_profit_rate' =>
                        $validated['financial_data']
                            ['operating_profit_rate'],

                    'debt_ratio' =>
                        $validated['financial_data']['debt_ratio'],

                    'net_worth_assets' =>
                        $validated['financial_data']['net_worth_assets'],

                    'working_capital_total_assets' =>
                        $validated['financial_data']
                            ['working_capital_total_assets'],

                    'net_income_total_assets' =>
                        $validated['financial_data']
                            ['net_income_total_assets'],

                    'total_asset_turnover' =>
                        $validated['financial_data']
                            ['total_asset_turnover'],

                    'retained_earnings_total_assets' =>
                        $validated['financial_data']
                            ['retained_earnings_total_assets'],

                    'interest_coverage_ratio' =>
                        $validated['financial_data']
                            ['interest_coverage_ratio'],

                    'equity_liability' =>
                        $validated['financial_data']
                            ['equity_liability'],

                    'cash_flow_total_assets' =>
                        $validated['financial_data']
                            ['cash_flow_total_assets'],
                ]);


                /*
                 * 3. Explications SHAP
                 */

                foreach (
                    $validated['explanations'] ?? []
                    as $explanation
                ) {

                    FinancialHealthExplanation::create([

                        'financial_health_report_id' =>
                            $report->id,

                        'feature' =>
                            $explanation['feature'],

                        'shap_value' =>
                            $explanation['shap_value'],

                        'impact' =>
                            $explanation['impact'],
                    ]);
                }

                return $report;
            });


            /*
             * --------------------------------------------------------
             * CHARGEMENT DES RELATIONS
             * --------------------------------------------------------
             */

            $report->load([
                'company',
                'indicators',
                'explanations',
            ]);


            /*
             * --------------------------------------------------------
             * RÉPONSE
             * --------------------------------------------------------
             */

            return response()->json([
                'success' => true,

                'message' =>
                    'Rapport financier enregistré.',

                'data' => $report,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * ============================================================
     * HISTORIQUE
     * ============================================================
     */
    public function history(
        Request $request
    ): JsonResponse {

        try {

            $reports = FinancialHealthReport::with([
                'company',
                'indicators',
                'explanations',
            ])
                ->where(
                    'user_id',
                    $request->user()->id
                )
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reports,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * ============================================================
     * AFFICHER UN RAPPORT
     * ============================================================
     */
    public function show(
        Request $request,
        FinancialHealthReport $report
    ): JsonResponse {

        /*
         * Sécurité :
         * un utilisateur ne peut consulter que ses propres rapports.
         */
        if ($report->user_id !== $request->user()->id) {

            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        $report->load([
            'company',
            'indicators',
            'explanations',
        ]);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }


    /**
     * ============================================================
     * EXPLICATION SHAP
     * ============================================================
     *
     * Logique existante conservée.
     */
    public function explain(
        Request $request,
        FinancialHealthService $financialHealthService
    ): JsonResponse {

        $validated = $request->validate([
            'current_ratio' => 'required|numeric',
            'cash_total_assets' => 'required|numeric',
            'roa_before_interest_depreciation' => 'required|numeric',
            'operating_profit_rate' => 'required|numeric',
            'debt_ratio' => 'required|numeric',
            'net_worth_assets' => 'required|numeric',
            'working_capital_total_assets' => 'required|numeric',
            'net_income_total_assets' => 'required|numeric',
            'total_asset_turnover' => 'required|numeric',
            'retained_earnings_total_assets' => 'required|numeric',
            'interest_coverage_ratio' => 'required|numeric',
            'equity_liability' => 'required|numeric',
            'cash_flow_total_assets' => 'required|numeric',
        ]);

        try {

            $result = $financialHealthService->explain(
                $validated
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
