<?php
/**
 * 路由配置
 */
use Webman\Route;

// API 路由组
Webman\Route::group('/api', function () {
    // 简历上传
    Route::post('/resume/upload', [App\Controller\ResumeController::class, 'upload']);

    // 解析简历文件（仅提取文本）
    Route::post('/resume/parse', [App\Controller\ResumeController::class, 'parse']);

    // 简历分析
    Route::post('/resume/analyze', [App\Controller\ResumeController::class, 'analyze']);

    // 获取分析结果
    Route::get('/resume/result/{id}', [App\Controller\ResumeController::class, 'result']);

    // 生成面试问题
    Route::post('/resume/questions', [App\Controller\ResumeController::class, 'generateQuestions']);

    // 健康检查
    Route::get('/health', function () {
        return json(['code' => 200, 'msg' => 'ok']);
    });
});

// CORS 预检请求
Route::options('/api/{path}', function () {
    return response('', 200);
});
