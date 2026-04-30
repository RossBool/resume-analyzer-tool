<?php

namespace support\middleware;

use Webman\MiddlewareInterface;
use Webman\Http\Response;
use Webman\Http\Request;

/**
 * CORS 访问控制中间件
 */
class AccessControl implements MiddlewareInterface
{
    public function process(Request $request, callable $handler): Response
    {
        // 处理预检请求
        if ($request->method() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $handler($request);
        }

        // 添加 CORS 头
        $response->withHeaders([
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Origin' => $request->header('origin', '*'),
            'Access-Control-Allow-Methods' => $request->header('access-control-request-method', '*'),
            'Access-Control-Allow-Headers' => $request->header('access-control-request-headers', '*'),
        ]);

        return $response;
    }
}
