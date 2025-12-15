<?php

namespace App\Http\Middleware;

use App\Models\SettingApp;
use App\Helpers\EcommerceHelper;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;


class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            'app' => [
                'name' => config('app.name'),
            ],

            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                    ]
                    : null,
            ],

            'flash' => [
                'success' => fn () => session('success'),
                'error' => fn () => session('error'),
            ],

            'setting' => fn () => SettingApp::select(
                'app_name',
                'logo',
            )->first(),
        ]);

    }
}
