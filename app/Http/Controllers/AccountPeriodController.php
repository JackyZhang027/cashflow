<?php

namespace App\Http\Controllers;

use App\Models\AccountPeriod;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountPeriodController extends Controller
{
    /**
     * Display listing
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $filters = $request->input('filters', []);
        $sort = $request->input('sort');
        $direction = $request->input('direction', 'asc');

        $data = AccountPeriod::query()
            ->when($search, fn ($q) =>
                $q->where('name', 'like', "%{$search}%")
            )
            
            /* FILTER: STATUS */
            ->when(
                !empty($filters['status']),
                fn ($q) => $q->where(
                    'status',
                    $filters['status']
                )
            )

            /* SORT */
            ->when($sort, function ($q) use ($sort, $direction) {
                match ($sort) {
                    'name', 'start_date', 'end_date', 'status' => $q->orderBy(
                        $sort,
                        $direction
                    ),
                    default => null,
                };
            })
            ->orderBy('start_date', 'desc')
            ->paginate(10)
            ->through(fn ($period) => [
                'id' => $period->id,
                'name' => $period->name,
                'start_date' => $period->start_date,
                'end_date' => $period->end_date,
                'status' => $period->status,
            ]);

        return Inertia::render('account_period/Index', [
            'data' => $data,
            'search' => $search ?? '',
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('account_period/Create');
    }

    /**
     * Store new period
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|unique:account_periods,name',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'status'     => 'required|in:open,closed',
        ]);

        $this->ensureNoOverlap($validated['start_date'], $validated['end_date']);

        AccountPeriod::create($validated);

        return redirect()->back()->with('success', 'Account period created successfully.');
    }

    /**
     * Update period
     */
    public function update(Request $request, AccountPeriod $period)
    {
        $validated = $request->validate([
            'name'       => 'required|string|unique:account_periods,name,' . $period->id,
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'status'     => 'required|in:open,closed',
        ]);

        $this->ensureNoOverlap(
            $validated['start_date'],
            $validated['end_date'],
            $period->id
        );

        $period->update($validated);

        return redirect()->back()->with('success', 'Account period updated successfully.');
    }

    /**
     * Delete single period
     */
    public function destroy(AccountPeriod $period)
    {
        $period->delete();

        return redirect()->back()->with('success', 'Account period deleted successfully.');
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'required|integer|exists:account_periods,id',
        ]);

        AccountPeriod::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' periods deleted successfully.');
    }

    /**
     * Bulk open
     */
    public function bulkActivate(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'required|integer|exists:account_periods,id',
        ]);

        if (AccountPeriod::where('status', 'open')->exists()) {
            return redirect()->back()->with(
                'error',
                'Only one account period can be open at a time.'
            );
        }

        AccountPeriod::whereIn('id', $request->ids)->update(['status' => 'open']);

        return redirect()->back()->with('success', 'Periods opened successfully.');
    }

    /**
     * Bulk close
     */
    public function bulkDeactivate(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'required|integer|exists:account_periods,id',
        ]);

        AccountPeriod::whereIn('id', $request->ids)->update(['status' => 'closed']);

        return redirect()->back()->with('success', 'Periods closed successfully.');
    }

    /* =========================
       Business Rule Methods
       ========================= */

    private function ensureNoOverlap($start, $end, $ignoreId = null)
    {
        $query = AccountPeriod::where('start_date', '<=', $end)
            ->where('end_date', '>=', $start);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'start_date' => 'The selected date range overlaps with an existing period.',
            ]);
        }
    }

}
