<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Pengeluaran Kas</title>

    {{-- Barcode --}}
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>

    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .slip {
            border: 2px solid #000;
            padding: 16px;
            width: 100%;
            height: 240px;
            box-sizing: border-box;
        }

        .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
        }

        .branch {
            font-weight: bold;
            font-size: 25px
        }

        .title {
            text-align: center;
        }

        .title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .title div {
            font-weight: bold;
            text-decoration: underline;
            margin-top: 2px;
        }

        .barcode {
            text-align: right;
        }

        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
        }

        .row {
            display: grid;
            grid-template-columns: 80px 1fr;
            gap: 6px;
            margin-bottom: 4px;
        }

        .amount-box {
            border: 1px solid #000;
            padding: 4px 8px;
            display: inline-block;
            min-width: 120px;
            font-weight: bold;
        }

        .footer {
            
            display: flex;
            justify-content: space-between;
        }

        .sign {
            text-align: center;
            width: 160px;
            margin-top: 12px;
        }

        .sign-line {
            border-top: 1px solid #000;
            margin-top: 48px;
        }

        @media print {
            body {
                margin: 0;
            }
        }
    </style>
</head>
<body>

@foreach ($transactions as $trx)
    <div class="slip">
        {{-- HEADER --}}
        <div class="header">
            <div class="branch">
                {{ $trx->branch->name ?? 'AA' }}
            </div>

            <div class="title">
                <h1>TCB</h1>
                <div>Pengeluaran Kas</div>
            </div>

            <div class="barcode">
                <svg class="barcode-svg"
                     jsbarcode-value="{{ $trx->full_reference }}"
                     jsbarcode-width="1"
                     jsbarcode-height="30"
                     jsbarcode-fontsize="8"
                     jsbarcode-margin="0">
                </svg>
            </div>
        </div>

        {{-- CONTENT --}}
        <div class="content">
            <div>
                <div class="row">
                    <div>Tanggal</div>
                    <div>{{ \Carbon\Carbon::parse($trx->transaction_date)->translatedFormat('d F Y') }}</div>
                </div>

                <div class="row">
                    <div>Pemohon</div>
                    <div style="font-weight: bold">{{ $trx->actor_name }}</div>
                </div>

                <div class="row">
                    <div>Jumlah</div>
                    <div>
                        <span class="amount-box">
                            {{ $trx->currency->symbol ?? 'Rp' }}
                            {{ number_format($trx->amount, 2, ',', '.') }}
                        </span>
                    </div>
                </div>

                <div class="row">
                    <div>Terbilang</div>
                    <div># {{ $trx->amount_in_words }} #</div>
                </div>
            </div>
        </div>

        {{-- FOOTER --}}
        <div class="footer">
            <div class="sign">
                Penerima
                <div class="sign-line"></div>
            </div>

            <div class="sign">
                Disetujui
                <div class="sign-line"></div>
            </div>
        </div>
    </div>

    {{-- spacing between slips --}}
    <div style="height:12px"></div>
@endforeach

<script>
    JsBarcode(".barcode-svg").init();
    window.onload = () => window.print();
</script>

</body>
</html>
