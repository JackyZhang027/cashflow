<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $filters = $request->input('filters', []);
        $sort = $request->input('sort');
        $direction = $request->input('direction', 'asc');

        $data = Currency::query()
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('symbol', 'like', "%{$search}%");
                });
            })
            
            /* FILTER: STATUS */
            ->when(
                !empty($filters['status']),
                fn ($q) => $q->where(
                    'is_active',
                    $filters['status'] === 'active'
                )
            )

            /* SORT */
            ->when($sort, function ($q) use ($sort, $direction) {
                match ($sort) {
                    'code', 'name', 'symbol', 'precision', 'status' => $q->orderBy(
                        $sort === 'status' ? 'is_active' : $sort,
                        $direction
                    ),
                    default => null,
                };
            })

            ->paginate(10)
            ->through(fn ($currency) => [
                'id' => $currency->id,
                'code' => $currency->code,
                'name' => $currency->name,
                'symbol' => $currency->symbol,
                'precision' => $currency->precision,
                'status' => $currency->is_active ? 'Active' : 'Inactive',
                'is_active' => $currency->is_active,
            ]);

        return Inertia::render('currencies/Index', [
            'data' => $data,
            'search' => $search ?? '',
        ]);
    }



    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('currencies/Create', [
            'show' => true,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies,code',
            'name' => 'required|string',
            'symbol' => 'nullable|string|max:5',
            'precision' => 'required|integer|min:0|max:6',
            'is_active' => 'boolean',
        ]);

        Currency::create($validated);

        return redirect()->back()->with('success', 'Currency created successfully.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Currency $currency)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Currency $currency)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies,code,' . $currency->id,
            'name' => 'required|string',
            'symbol' => 'nullable|string|max:5',
            'precision' => 'required|integer|min:0|max:6',
            'is_active' => 'boolean',
        ]);

        $currency->update($validated);

        return redirect()->back()->with('success', 'Currency updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Currency $currency)
    {
        $currency->delete();
        return redirect()->back()->with('success', 'Currency deleted successfully.');
    }
    /**
     * Bulk delete currencies.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:currencies,id',
        ]);

        try {
            Currency::whereIn('id', $request->ids)->delete();

            return redirect()->back()->with('success', count($request->ids) . ' currencies deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete currencies: ' . $e->getMessage());
        }
    }

    /**
     * Bulk activate currencies.
     */
    public function bulkActivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:currencies,id',
        ]);

        try {
            Currency::whereIn('id', $request->ids)->update(['is_active' => true]);

            return redirect()->back()->with('success', count($request->ids) . ' currencies activated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to activate currencies: ' . $e->getMessage());
        }
    }

    /**
     * Bulk deactivate currencies.
     */
    public function bulkDeactivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:currencies,id',
        ]);

        try {
            Currency::whereIn('id', $request->ids)->update(['is_active' => false]);

            return redirect()->back()->with('success', count($request->ids) . ' currencies deactivated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to deactivate currencies: ' . $e->getMessage());
        }
    }


}
