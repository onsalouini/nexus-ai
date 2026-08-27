<?php

namespace App\Http\Controllers;

use App\Services\FinancialHealthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class FinancialHealthController extends Controller
{
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
