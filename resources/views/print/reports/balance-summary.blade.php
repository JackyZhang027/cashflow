<!DOCTYPE html>
<html>
<head>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        th, td {
            padding: 4px;
        }
        th {
            border-bottom: 1px solid #000;
        }
    </style>

</head>
<body>

<h3>Balance Summary</h3>
<p>Period: {{ $from }} – {{ $to }}</p>

<table>
    <thead>
        <tr>
            <th>Info Cabang</th>
            <th>Currency</th>
            <th>Begin Balance</th>
            <th>Transaction Balance</th>
            <th>Ending Balance</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $i => $row)
            @php
                $isNewBranch = $i > 0 && $data[$i-1]->branch !== $row->branch;
                $borderStyle = $isNewBranch ? 'border-top:2px dashed #000;' : '';
            @endphp

            <tr>
                <td style="{{ $borderStyle }}">
                    {{ $row->branch }}
                </td>
                <td style="{{ $borderStyle }}">
                    {{ $row->currency }}
                </td>
                <td style="{{ $borderStyle }} text-align:right;">
                    {{ number_format($row->begin_balance, 2) }}
                </td>
                <td style="{{ $borderStyle }} text-align:right;">
                    {{ number_format($row->transaction_balance, 2) }}
                </td>
                <td style="{{ $borderStyle }} text-align:right;">
                    {{ number_format($row->ending_balance, 2) }}
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

@include('print.reports.footer')
</body>
</html>
