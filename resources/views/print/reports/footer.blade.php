<script type="text/php">
    if (isset($pdf)) {
        $pdf->page_script(function ($pageNumber, $pageCount, $pdf) {

            $y = 820; // footer Y for A4 portrait

            // LEFT: printed datetime + user
            $pdf->text(
                40,
                $y,
                "Printed: {{ $printedAt }} | By: {{ $printedBy }}",
                null,
                9
            );

            // RIGHT: pagination
            $pdf->text(
                520,
                $y,
                "Page {$pageNumber} / {$pageCount}",
                null,
                9
            );
        });
    }
</script>
