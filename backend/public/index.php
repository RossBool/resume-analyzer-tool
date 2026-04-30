<?php
/**
 * PHP 内置服务器入口
 */

// 设置基础路径
$publicDir = __DIR__;
$baseDir = dirname($publicDir);

// 加载 autoload
require_once $baseDir . '/autoload.php';

// 获取请求路径
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// 静态文件直接返回
if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/', $requestPath)) {
    $staticFile = $publicDir . $requestPath;
    if (file_exists($staticFile)) {
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'eot' => 'application/vnd.ms-fontobject',
        ];
        $ext = pathinfo($staticFile, PATHINFO_EXTENSION);
        $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $mimeType");
        readfile($staticFile);
        return;
    }
}

// CORS 处理
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    return;
}

// 添加 CORS 头
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理 API 请求
if (strpos($requestPath, '/api/') === 0) {
    header('Content-Type: application/json');

    $route = substr($requestPath, 5);

    if ($route === 'health') {
        echo json_encode(['code' => 200, 'msg' => 'ok', 'data' => ['version' => '1.0.0']]);
        return;
    }

    if (preg_match('#^resume/(upload|analyze|analyze-stream|questions|result/?.*)$#', $route, $matches)) {
        $action = $matches[1];
        $controller = new \App\Controller\ResumeController();

        try {
            switch ($action) {
                case 'upload':
                    $response = $controller->upload();
                    break;
                case 'analyze':
                    $response = $controller->analyze();
                    break;
                case 'analyze-stream':
                    $controller->analyzeStream();
                    return;
                case 'questions':
                    $response = $controller->generateQuestions();
                    break;
                default:
                    $response = ['code' => 404, 'msg' => 'Not Found'];
            }

            if (is_array($response)) {
                echo json_encode($response, JSON_UNESCAPED_UNICODE);
            } elseif (is_string($response)) {
                echo $response;
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'code' => 500,
                'msg' => 'Server Error',
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        return;
    }
}

header('HTTP/1.1 404 Not Found');
echo json_encode(['code' => 404, 'msg' => 'Not Found']);
