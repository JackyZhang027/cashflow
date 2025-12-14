<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $data = Branch::query()
        ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('province', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->paginate(10)
            ->through(fn ($branch) => [
                'id' => $branch->id,
                'code' => $branch->code,
                'name' => $branch->name,
                'city' => $branch->city,
                'address' => $branch->address,
                'province' => $branch->province,
                'status' => $branch->is_active ? 'Active' : 'Inactive',
                'is_active' => $branch->is_active
            ]);
        return Inertia::render('branches/Index', [
            'data' => $data,
            'search' => $request->search,
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
            'address' => 'nullable|max:255',
            'city' => 'nullable|max:100',
            'province' => 'nullable|max:100',
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
            'address' => 'nullable|max:255',
            'city' => 'nullable|max:100',
            'province' => 'nullable|max:100',
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
        $branch->delete();
        return redirect()->back()->with('success', 'Branch deleted successfully.');
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
            Branch::whereIn('id', $request->ids)->delete();

            return redirect()->back()->with('success', count($request->ids) . ' branches deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete branches: ' . $e->getMessage());
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
