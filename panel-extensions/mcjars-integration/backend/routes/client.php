<?php

use Illuminate\Support\Facades\Route;
use Reviactyl\Extensions\MCJars\Http\Controllers\Api\Client\Servers\MCJarsController;

Route::group(['prefix' => '/servers/{server}/mcjars'], function () {
    Route::get('/types', [MCJarsController::class, 'getTypes']);
    Route::get('/types/{type}', [MCJarsController::class, 'getTypeDetails']);
    Route::get('/builds/{type}/{version}', [MCJarsController::class, 'getBuildDetails']);
    Route::post('/install', [MCJarsController::class, 'installJar']);
    Route::get('/autoupdate/status', [MCJarsController::class, 'getAutoUpdateStatus']);
    Route::post('/autoupdate/install', [MCJarsController::class, 'installAutoUpdate']);
    Route::get('/autoupdate/script', [MCJarsController::class, 'getAutoUpdateScript']);
});

Route::get('/ping', fn() => response()->json([
    'status' => 'ok',
    'extension' => 'mcjars-integration',
    'version' => '1.3.0',
    'features' => ['switcher', 'autoupdate']
]));
