<?php

use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'extension' => 'modrinth-plugin-installer',
        'version' => '1.2.1'
    ]);
});
