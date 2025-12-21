<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reference',
        'branch_id',
        'currency_id',
        'transaction_date',
        'type',
        'amount',
        'description',
        'actor_name',
        'status',
        'approved_at',
        'approved_by',
        'is_opening',
        'created_by',
        'updated_by',
        'deleted_by',
    ];
    
    protected $casts = [
        'is_opening' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['amount_in_words', 'full_reference'];

    protected static function booted()
    {
        /**
         * CREATE
         */
        static::creating(function ($transaction) {
            if (! $transaction->reference) {
                $transaction->reference = $transaction->generateReference();
            }
        });
    }

    protected function generateReference(): string
    {
        return DB::transaction(function () {

            $date  = Carbon::parse($this->transaction_date);
            $year  = $date->format('y');
            $month = $date->format('m');

            // 1 = in, 0 = out
            $typeFlag = $this->type === 'in' ? '1' : '0';

            $prefix = "{$year}{$month}{$typeFlag}";
            $prefixLength = strlen($prefix);

            $last = self::withTrashed()
                ->where('reference', 'like', "{$prefix}%")
                ->lockForUpdate()
                ->orderByDesc(DB::raw('LENGTH(reference)'))
                ->orderByDesc('reference')
                ->first();

            $seq = 1;

            if ($last) {
                // extract numeric part AFTER prefix
                $lastSeq = (int) substr($last->reference, $prefixLength);
                $seq = $lastSeq + 1;
            }

            // pad ONLY if less than 100
            $seqPart = $seq < 100
                ? str_pad($seq, 3, '0', STR_PAD_LEFT)
                : (string) $seq;

            return $prefix . $seqPart;
        });
    }


    /**
     * Get the amount in Indonesian words
     */
    private function currencyWord(): string
    {
        return match ($this->currency?->code) {
            'IDR' => 'rupiah',
            'USD' => 'dolar',
            'SGD' => 'dolar singapura',
            'EUR' => 'euro',
            default => '',
        };
    }

    /**
     * Get the amount in Indonesian words
     */
    public function getAmountInWordsAttribute(): string
    {
        $amount = (int) floor($this->amount);
        $words  = $this->numberToIndonesianWords($amount);

        return trim($words . ' ' . $this->currencyWord());
    }

    /**
     * Convert number to Indonesian words
     */
    private function numberToIndonesianWords(int $number): string
    {
        if ($number === 0) {
            return 'nol';
        }

        $units = [
            '', 'satu', 'dua', 'tiga', 'empat',
            'lima', 'enam', 'tujuh', 'delapan', 'sembilan'
        ];

        $scales = [
            1000000000000 => 'triliun',
            1000000000    => 'miliar',
            1000000       => 'juta',
            1000          => 'ribu',
            100           => 'ratus',
        ];

        $result = '';

        foreach ($scales as $value => $label) {
            if ($number >= $value) {
                $count = intdiv($number, $value);
                $number %= $value;

                if ($value === 100 && $count === 1) {
                    $result .= 'seratus ';
                } elseif ($value === 1000 && $count === 1) {
                    $result .= 'seribu ';
                } else {
                    $result .= $this->numberToIndonesianWords($count) . " {$label} ";
                }
            }
        }

        if ($number > 0) {
            if ($number < 10) {
                $result .= $units[$number];
            } elseif ($number < 20) {
                $result .= match ($number) {
                    10 => 'sepuluh',
                    11 => 'sebelas',
                    default => $units[$number - 10] . ' belas',
                };
            } else {
                $tens = intdiv($number, 10);
                $ones = $number % 10;

                $result .= $units[$tens] . ' puluh';
                if ($ones > 0) {
                    $result .= ' ' . $units[$ones];
                }
            }
        }

        return trim($result);
    }

    public function getFullReferenceAttribute(): string
    {
        return sprintf(
            '%s%s%s',
            $this->currency?->code ?? 'XX',
            $this->branch?->code ?? 'XXX',
            $this->reference
        );
    }



    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
