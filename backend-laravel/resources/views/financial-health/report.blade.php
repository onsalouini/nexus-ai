<!DOCTYPE html>

<html lang="fr">
<head>
    <meta charset="UTF-8">

<title>Rapport de santé financière</title>

<style>
    body {
        font-family: DejaVu Sans, sans-serif;
        color: #1e293b;
        font-size: 12px;
        line-height: 1.5;
    }

    h1 {
        color: #0f172a;
        margin-bottom: 5px;
    }

    h2 {
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 6px;
        margin-top: 25px;
    }

    .header {
        margin-bottom: 25px;
    }

    .date {
        color: #64748b;
        font-size: 10px;
    }

    .score-box {
        padding: 20px;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        margin-bottom: 20px;
    }

    .score {
        font-size: 34px;
        font-weight: bold;
    }

    .healthy {
        color: #059669;
    }

    .risk {
        color: #dc2626;
    }

    .grid {
        width: 100%;
    }

    .grid td {
        width: 50%;
        padding: 8px;
        vertical-align: top;
    }

    .label {
        color: #64748b;
        font-size: 10px;
    }

    .value {
        font-weight: bold;
        font-size: 14px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    th {
        background: #f1f5f9;
        text-align: left;
        padding: 8px;
    }

    td {
        border-bottom: 1px solid #e2e8f0;
        padding: 8px;
    }

    .positive {
        color: #059669;
    }

    .negative {
        color: #dc2626;
    }

    .ai-box {
        background: #f8fafc;
        border-left: 4px solid #6366f1;
        padding: 15px;
        margin-top: 10px;
    }

    .recommendation {
        margin-bottom: 8px;
    }

    .footer {
        margin-top: 30px;
        color: #94a3b8;
        font-size: 9px;
        text-align: center;
    }
</style>

</head>

<body>

<div class="header">
    <h1>NEXUS AI</h1>

```
<h2 style="border: none; margin-top: 0;">
    Rapport de santé financière
</h2>

<div class="date">
    Généré le {{ $report->created_at->format('d/m/Y à H:i') }}
</div>
```

</div>

<div class="score-box">

```
<div class="label">
    Entreprise
</div>

<div class="value">
    {{ $report->company->name ?? 'Entreprise' }}
</div>

<br>

<table class="grid">
    <tr>
        <td>
            <div class="label">Score de santé</div>

            <div class="score {{ $report->financial_health === 'healthy' ? 'healthy' : 'risk' }}">
                {{ number_format($report->health_score, 1) }}/100
            </div>
        </td>

        <td>
            <div class="label">
                Probabilité de faillite
            </div>

            <div class="value">
                {{ number_format($report->bankruptcy_probability * 100, 2) }}%
            </div>

            <div class="label">
                Seuil :
                {{ number_format($report->decision_threshold * 100, 0) }}%
            </div>
        </td>
    </tr>
</table>

<br>

<strong>
    {{ $report->financial_health === 'healthy'
        ? 'Situation financière saine'
        : 'Entreprise à risque'
    }}
</strong>
```

</div>

<h2>Indicateurs financiers</h2>

<table>
    <tr>
        <th>Indicateur</th>
        <th>Valeur</th>
    </tr>

```
<tr>
    <td>Current Ratio</td>
    <td>{{ $report->indicators->current_ratio }}</td>
</tr>

<tr>
    <td>Cash / Total Assets</td>
    <td>{{ $report->indicators->cash_total_assets }}</td>
</tr>

<tr>
    <td>ROA avant intérêts et dépréciation</td>
    <td>{{ $report->indicators->roa_before_interest_depreciation }}</td>
</tr>

<tr>
    <td>Operating Profit Rate</td>
    <td>{{ $report->indicators->operating_profit_rate }}</td>
</tr>

<tr>
    <td>Debt Ratio</td>
    <td>{{ $report->indicators->debt_ratio }}</td>
</tr>

<tr>
    <td>Net Worth / Assets</td>
    <td>{{ $report->indicators->net_worth_assets }}</td>
</tr>

<tr>
    <td>Working Capital / Assets</td>
    <td>{{ $report->indicators->working_capital_total_assets }}</td>
</tr>

<tr>
    <td>Net Income / Assets</td>
    <td>{{ $report->indicators->net_income_total_assets }}</td>
</tr>

<tr>
    <td>Total Asset Turnover</td>
    <td>{{ $report->indicators->total_asset_turnover }}</td>
</tr>

<tr>
    <td>Retained Earnings / Assets</td>
    <td>{{ $report->indicators->retained_earnings_total_assets }}</td>
</tr>

<tr>
    <td>Interest Coverage Ratio</td>
    <td>{{ $report->indicators->interest_coverage_ratio }}</td>
</tr>

<tr>
    <td>Equity / Liability</td>
    <td>{{ $report->indicators->equity_liability }}</td>
</tr>

<tr>
    <td>Cash Flow / Assets</td>
    <td>{{ $report->indicators->cash_flow_total_assets }}</td>
</tr>
```

</table>

<h2>Explication SHAP</h2>

<table>
    <tr>
        <th>Facteur</th>
        <th>SHAP</th>
        <th>Impact</th>
    </tr>

```
@foreach($report->explanations as $explanation)

    <tr>
        <td>
            {{ $explanation->feature }}
        </td>

        <td>
            {{ $explanation->shap_value > 0 ? '+' : '' }}
            {{ number_format($explanation->shap_value, 4) }}
        </td>

        <td class="{{ $explanation->impact === 'increases_risk' ? 'negative' : 'positive' }}">
            {{ $explanation->impact === 'increases_risk'
                ? 'Augmente le risque'
                : 'Réduit le risque'
            }}
        </td>
    </tr>

@endforeach
```

</table>

@if($report->ai_analysis)

```
<h2>Analyse intelligente NEXUS AI</h2>

<div class="ai-box">
    {!! nl2br(e($report->ai_analysis)) !!}
</div>
```

@endif

@if($report->ai_recommendations)

```
<h2>Suggestions d'amélioration</h2>

<div class="ai-box">

    @foreach($report->ai_recommendations as $recommendation)

        <div class="recommendation">
            • {{ $recommendation }}
        </div>

    @endforeach

</div>
```

@endif

<h2>Informations du modèle</h2>

<table>
    <tr>
        <td>Modèle</td>
        <td>{{ $report->model_version ?? '1.0.0' }}</td>
    </tr>

```
<tr>
    <td>Seuil de décision</td>
    <td>
        {{ number_format($report->decision_threshold * 100, 2) }}%
    </td>
</tr>

<tr>
    <td>Probabilité de faillite</td>
    <td>
        {{ number_format($report->bankruptcy_probability * 100, 2) }}%
    </td>
</tr>
```

</table>

<div class="footer">
    NEXUS AI — Financial Health Analysis
</div>

</body>
</html>
