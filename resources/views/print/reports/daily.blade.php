<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-size: 11px;
            font-family: DejaVu Sans;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            border-bottom: 1px solid #000;
            padding: 4px;
            text-align: left;
        }
        td {
            padding: 4px;
        }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>

<h3 class="center">LAPORAN HARIAN</h3>
<table style="font-weight: bold">
    <tr>
        <td style="width:50px">Tanggal</td>
        <td>: {{ $date }}</td>
    </tr>
    <tr>
        <td>Cabang</td>
        <td>: {{ $branch }}</td>
    </tr>
    <tr>
        <td>Currency</td>
        <td>: {{ $currency }}</td>
    </tr>
</table>

<table>
    <thead>
        <tr>
            <th class="center">Tanggal Approved</th>
            <th class="center">Cabang</th>
            <th class="center">Terima Dari/Pemohon</th>
            <th class="center">Keterangan</th>
            <th class="center">No Trans</th>
            <th class="right">Debit</th>
            <th class="right">Credit</th>
            <th class="right">Balance</th>
        </tr>
    </thead>
    <tbody>
        @php
            $balance = $beginBalance;
            $totalDebit = 0;
            $totalCredit = 0;
        @endphp

        <tr class="bold">
            <td colspan="7">BEGIN BALANCE</td>
            <td class="right">{{ number_format($balance, 2) }}</td>
        </tr>

        @foreach($transactions as $t)
            @php
                $debit = $t->type === 'in' ? $t->amount : 0;
                $credit = $t->type === 'out' ? $t->amount : 0;
                $balance += $debit - $credit;
                $totalDebit += $debit;
                $totalCredit += $credit;
            @endphp
            <tr>
                <td>{{ $t->approved_at }}</td>
                <td>{{ $t->branch->code }}</td>
                <td>{{ $t->actor_name }}</td>
                <td>{{ $t->description }}</td>
                <td>{{ $t->full_reference }}</td>
                <td class="right">
                    {{ $debit ? number_format($debit, 2) : '' }}
                </td>
                <td class="right">
                    {{ $credit ? number_format($credit, 2) : '' }}
                </td>
                <td class="right">{{ number_format($balance, 2) }}</td>
            </tr>
        @endforeach

        <tr class="bold">
            <td colspan="5" class="right">TOTAL</td>
            <td class="right">{{ number_format($totalDebit, 2) }}</td>
            <td class="right">{{ number_format($totalCredit, 2) }}</td>
            <td class="right">{{ number_format($balance, 2) }}</td>
        </tr>
    </tbody>
</table>

@include('print.reports.footer')

</body>
</html>
