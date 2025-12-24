<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Print Slip Setoran</title>

    {{-- Barcode --}}
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>

    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .page {
            page-break-after: always;
            margin-bottom: 20px;
        }

        .grid-page {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pair {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 16px;
        }

        .card {
            border: 2px solid #000;
            padding: 12px;
            height: 310px;
            position: relative;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
        }

        .logo {
            font-size: 36px;
            font-weight: 900;
        }

        .title {
            text-align: center;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
        }

        .rows {
            font-size: 11px;
            line-height: 1.4;
        }

        .row {
            display: grid;
            grid-template-columns: 70px 1fr;
            gap: 6px;
        }

        .row-header {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .amount-box {
            border: 1px solid #000;
            padding: 2px 6px;
            display: inline-block;
            min-width: 80px;
        }

        .cap-box {
            position: absolute;
            bottom: 12px;
            right: 12px;
            border: 1px solid #000;
            width: 96px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
        }

        .signature {
            position: absolute;
            bottom: 12px;
            left: 12px;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 120px;
            margin-top: 52px;
        }
        @page {
            size: A4;
            margin: 10mm;
        }

        @media print {
            body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .page {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>

@php
    $chunks = $transactions->chunk(3);
@endphp

@foreach ($chunks as $page)
    <div class="page">
        <div class="grid-page">

            @foreach ($page as $trx)
                <div class="pair">

                    {{-- LEFT : SETORAN KAS --}}
                    <div class="card">
                        <div class="header">
                            <div class="logo">TCB</div>
                            <svg class="barcode" jsbarcode-value="{{ $trx->reference }}"
                                 jsbarcode-width="1"
                                 jsbarcode-height="30"
                                 jsbarcode-fontsize="8"
                                 jsbarcode-margin="0">
                            </svg>
                        </div>

                        <div class="title">Setoran Kas</div>

                        <div class="rows">
                            <div class="row-header">{{ $trx->branch->name }}</div>

                            <div class="row">
                                <div>Tanggal</div>
                                <div>{{ $trx->transaction_date }}</div>
                            </div>

                            <div class="row">
                                <div>Penyetor</div>
                                <div>{{ $trx->actor_name }}</div>
                            </div>

                            <div class="row">
                                <div>Jumlah</div>
                                <div>
                                    <span class="amount-box">
                                        {{ $trx->currency->code }}
                                        {{ number_format($trx->amount, 2, ',', '.') }}
                                    </span>
                                </div>
                            </div>

                            <div class="row">
                                <div>Terbilang</div>
                                <div># {{ $trx->amount_in_words }} #</div>
                            </div>
                        </div>

                        <div class="cap-box">Cap</div>
                    </div>

                    {{-- RIGHT : BUKTI PENERIMAAN --}}
                    <div class="card">
                        <div class="header">
                            <div class="logo">TCB</div>
                            <svg class="barcode" jsbarcode-value="{{ $trx->reference }}"
                                 jsbarcode-width="1"
                                 jsbarcode-height="30"
                                 jsbarcode-fontsize="8"
                                 jsbarcode-margin="0">
                            </svg>
                        </div>

                        <div class="title">Bukti Penerimaan Kas</div>

                        <div class="rows">
                            <div class="row-header">{{ $trx->branch->name }}</div>

                            <div class="row">
                                <div>Tanggal</div>
                                <div>{{ $trx->transaction_date }}</div>
                            </div>

                            <div class="row">
                                <div>Penyetor</div>
                                <div>{{ $trx->actor_name }}</div>
                            </div>

                            <div class="row">
                                <div>Jumlah</div>
                                <div>
                                    <span class="amount-box">
                                        {{ $trx->currency->code }}
                                        {{ number_format($trx->amount, 2, ',', '.') }}
                                    </span>
                                </div>
                            </div>

                            <div class="row">
                                <div>Terbilang</div>
                                <div># {{ $trx->amount_in_words }} #</div>
                            </div>
                        </div>

                        <div class="signature">
                            <div>Penyetor</div>
                            <div class="signature-line"></div>
                        </div>
                    </div>

                </div>
            @endforeach

        </div>
    </div>
@endforeach

<script>
    JsBarcode(".barcode").init();
    window.onload = () => window.print();
</script>

</body>
</html>
