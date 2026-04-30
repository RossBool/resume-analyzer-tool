<?php
/**
 * 应用配置
 */
return [
    'debug' => env('APP_DEBUG', true),
    'default_timezone' => 'Asia/Shanghai',
    'request_class' => support\Request::class,
    'public_path' => base_path() . DIRECTORY_SEPARATOR . 'public',
    'runtime_path' => base_path() . DIRECTORY_SEPARATOR . 'runtime',
    'controller_suffix' => 'Controller',
    'controller_reuse' => true,
];
