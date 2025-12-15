<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class ShareMenus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        Inertia::share('menus', function () use ($user) {
            if (!$user) return [];

            return Cache::remember(
                "menus:user:{$user->id}",
                now()->addMinutes(10),
                function () use ($user) {

                    $allMenus = Menu::query()
                        ->select([
                            'id',
                            'parent_id',
                            'title',
                            'route',
                            'icon',
                            'permission_name',
                            'order',
                        ])
                        ->orderBy('order')
                        ->get();

                    $indexed = $allMenus->keyBy('id');

                    $buildTree = function ($parentId = null) use (&$buildTree, $indexed, $user) {
                        return $indexed
                            ->filter(fn ($menu) =>
                                $menu->parent_id === $parentId &&
                                (!$menu->permission_name || $user->can($menu->permission_name))
                            )
                            ->map(function ($menu) use (&$buildTree) {
                                return [
                                    'title' => $menu->title,
                                    'route' => $menu->route,
                                    'icon' => $menu->icon,
                                    'children' => $buildTree($menu->id)->values(),
                                ];
                            })
                            ->filter(fn ($menu) =>
                                $menu['route'] || $menu['children']->isNotEmpty()
                            )
                            ->values();
                    };

                    return $buildTree();
                }
            );
        });

        return $next($request);
    }

}
