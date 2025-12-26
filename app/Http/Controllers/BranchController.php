<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Database\QueryException;

class BranchController extends Controller
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
        
        $data = Branch::query()
            ->with(['openingBalances.currency'])

            /* SEARCH */
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
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
                    'code', 'name', 'status' => $q->orderBy(
                        $sort === 'status' ? 'is_active' : $sort,
                        $direction
                    ),
                    default => null,
                };
            })

            ->paginate(10)

            ->through(fn ($branch) => [
                'id' => $branch->id,
                'code' => $branch->code,
                'name' => $branch->name,
                'status' => $branch->is_active ? 'active' : 'inactive',
                'is_active' => $branch->is_active,
                'opening_balances' => $branch->openingBalances->map(fn ($ob) => [
                    'id' => $ob->id,
                    'currency_id' => $ob->currency_id,
                    'currency_code' => $ob->currency->code,
                    'amount' => $ob->opening_balance,
                    'opening_date' => $ob->opening_date,
                ]),
            ]);

        return Inertia::render('branches/Index', [
            'data' => $data,
            'search' => $search,
            'currencies' => Currency::where('is_active', true)->get(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|unique:branches,code|max:10',
            'name' => 'required|max:100',
            'is_active' => 'required|boolean',
        ]);

        Branch::create($validated);

        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Branch $branch)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Branch $branch)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'code' => 'required|max:10|unique:branches,code,' . $branch->id,
            'name' => 'required|max:100',
            'is_active' => 'required|boolean',
        ]);
        $branch->update($validated);
        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    
    public function destroy(Branch $branch)
    {
        try {
            $branch->forceDelete();
            return redirect()->back()->with('success', 'Branch deleted successfully.');
        } catch (QueryException $e) {
            return redirect()->back()->with('error', 'Cannot delete branch because it is still used in transactions.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete branch: ' . $e->getMessage());
        }
       
    }
    /**
     * Bulk delete branches.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:branches,id',
        ]);

        try {
            Branch::whereIn('id', $request->ids)->forceDelete();

            return redirect()->back()->with('success', count($request->ids) . ' branches deleted successfully');
        } catch (QueryException $e) {
            return redirect()->back()->with('error', 'Cannot delete branch because it is still used in transactions.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete branch: ' . $e->getMessage());
        }
    }

    /**
     * Bulk activate branches.
     */
    public function bulkActivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:branches,id',
        ]);

        try {
            Branch::whereIn('id', $request->ids)->update(['is_active' => true]);

            return redirect()->back()->with('success', count($request->ids) . ' branches activated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to activate branches: ' . $e->getMessage());
        }
    }

    /**
     * Bulk deactivate branches.
     */
    public function bulkDeactivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:branches,id',
        ]);

        try {
            Branch::whereIn('id', $request->ids)->update(['is_active' => false]);

            return redirect()->back()->with('success', count($request->ids) . ' branches deactivated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to deactivate branches: ' . $e->getMessage());
        }
    }

}
