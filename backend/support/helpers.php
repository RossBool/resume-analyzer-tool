<?php
/**
 * 辅助函数
 */

if (!function_exists('env')) {
    function env($key, $default = null)
    {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        return $value;
    }
}

if (!function_exists('base_path')) {
    function base_path($path = '')
    {
        return defined('BASE_PATH') ? BASE_PATH . ($path ? DIRECTORY_SEPARATOR . $path : $path) : dirname(__DIR__) . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('runtime_path')) {
    function runtime_path($path = '')
    {
        return base_path('runtime') . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('config_path')) {
    function config_path($path = '')
    {
        return base_path('config') . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('app_path')) {
    function app_path($path = '')
    {
        return base_path('app') . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('json')) {
    function json($data)
    {
        return \Webman\JsonResponse::json($data);
    }
}

if (!function_exists('response')) {
    function response($body = '', $status = 200, $headers = [])
    {
        return new \Workerman\Protocols\Http\Response($status, $headers, $body);
    }
}

if (!function_exists('cpu_count')) {
    function cpu_count()
    {
        if (strtolower(PHP_OS) === 'darwin') {
            $count = shell_exec('sysctl -n hw.ncpu');
        } elseif (strtolower(PHP_OS) === 'linux') {
            $count = shell_exec('nproc');
        } else {
            $count = 4;
        }
        return (int)$count > 0 ? (int)$count : 4;
    }
}
