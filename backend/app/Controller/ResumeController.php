<?php

namespace App\Controller;

use App\Service\ResumeParser;
use App\Service\AIAnalyzer;

/**
 * 简历控制器
 */
class ResumeController
{
    private $parser;
    private $aiAnalyzer;

    public function __construct()
    {
        $this->parser = new ResumeParser();
        $this->aiAnalyzer = new AIAnalyzer();
    }

    /**
     * 上传简历
     */
    public function upload()
    {
        try {
            // 使用原生 PHP 处理文件上传
            if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
                return $this->json([
                    'code' => 400,
                    'msg' => '文件上传失败或无效'
                ]);
            }

            $file = $_FILES['resume'];

            // 验证文件类型
            $allowedTypes = ['pdf', 'doc', 'docx'];
            $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            if (!in_array($fileExt, $allowedTypes)) {
                return $this->json([
                    'code' => 400,
                    'msg' => '不支持的文件类型，仅支持 PDF、DOC、DOCX'
                ]);
            }

            // 验证文件大小（10MB）
            $maxSize = 10 * 1024 * 1024;
            if ($file['size'] > $maxSize) {
                return $this->json([
                    'code' => 400,
                    'msg' => '文件大小超过限制（最大10MB）'
                ]);
            }

            // 移动文件到上传目录
            $uploadDir = BASE_PATH . '/public/uploads';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = uniqid('resume_') . '.' . $fileExt;
            $filePath = $uploadDir . '/' . $fileName;

            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                return $this->json([
                    'code' => 500,
                    'msg' => '文件保存失败'
                ]);
            }

            return $this->json([
                'code' => 200,
                'msg' => '上传成功',
                'data' => [
                    'file_path' => '/uploads/' . $fileName,
                    'file_name' => $file['name'],
                    'file_size' => $file['size']
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'code' => 500,
                'msg' => '上传失败: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * 解析简历文件（仅提取文本，不做AI分析）
     */
    public function parse()
    {
        try {
            // 获取 POST 数据
            $input = json_decode(file_get_contents('php://input'), true);
            $filePath = $input['file_path'] ?? '';

            if (!$filePath) {
                return $this->json([
                    'code' => 400,
                    'msg' => '请提供文件路径'
                ]);
            }

            $fullPath = BASE_PATH . '/public' . $filePath;

            if (!file_exists($fullPath)) {
                return $this->json([
                    'code' => 404,
                    'msg' => '文件不存在'
                ]);
            }

            // 解析简历文本
            $text = $this->parser->parse($fullPath);

            if (!$text) {
                return $this->json([
                    'code' => 500,
                    'msg' => '简历解析失败'
                ]);
            }

            // 只返回解析后的文本，不做AI分析
            return $this->json([
                'code' => 200,
                'msg' => '解析成功',
                'data' => [
                    'text' => $text
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'code' => 500,
                'msg' => '解析失败: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * 分析简历
     */
    public function analyze()
    {
        try {
            // 获取 POST 数据
            $input = json_decode(file_get_contents('php://input'), true);
            $filePath = $input['file_path'] ?? '';

            if (!$filePath) {
                return $this->json([
                    'code' => 400,
                    'msg' => '请提供文件路径'
                ]);
            }

            $fullPath = BASE_PATH . '/public' . $filePath;

            if (!file_exists($fullPath)) {
                return $this->json([
                    'code' => 404,
                    'msg' => '文件不存在'
                ]);
            }

            // 解析简历文本
            $text = $this->parser->parse($fullPath);

            if (!$text) {
                return $this->json([
                    'code' => 500,
                    'msg' => '简历解析失败'
                ]);
            }

            // 使用 AI 分析
            $analysis = $this->aiAnalyzer->analyze($text);

            return $this->json([
                'code' => 200,
                'msg' => '分析成功',
                'data' => $analysis
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'code' => 500,
                'msg' => '分析失败: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * 生成面试问题
     */
    public function generateQuestions()
    {
        try {
            // 获取 POST 数据
            $input = json_decode(file_get_contents('php://input'), true);
            $analysis = $input['analysis'] ?? '';

            if (!$analysis) {
                return $this->json([
                    'code' => 400,
                    'msg' => '请提供分析结果'
                ]);
            }

            $questions = $this->aiAnalyzer->generateQuestions($analysis);

            return $this->json([
                'code' => 200,
                'msg' => '生成成功',
                'data' => [
                    'questions' => $questions
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'code' => 500,
                'msg' => '生成失败: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * 获取分析结果
     */
    public function result()
    {
        // 这里可以实现从数据库获取历史分析结果
        return $this->json([
            'code' => 200,
            'msg' => 'ok'
        ]);
    }

    /**
     * 流式分析简历（SSE）
     */
    public function analyzeStream()
    {
        try {
            // 设置SSE响应头
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no'); // 禁用Nginx缓冲

            // 获取POST数据
            $input = json_decode(file_get_contents('php://input'), true);
            $filePath = $input['file_path'] ?? '';

            if (!$filePath) {
                $this->sendSSE('error', ['msg' => '请提供文件路径']);
                return;
            }

            $fullPath = BASE_PATH . '/public' . $filePath;

            if (!file_exists($fullPath)) {
                $this->sendSSE('error', ['msg' => '文件不存在']);
                return;
            }

            // 发送开始事件
            $this->sendSSE('start', ['message' => '开始分析简历']);

            // 步骤1: 解析简历
            $this->sendSSE('progress', ['step' => 1, 'message' => '正在解析简历文件...']);
            $text = $this->parser->parse($fullPath);

            if (!$text) {
                $this->sendSSE('error', ['msg' => '简历解析失败']);
                return;
            }

            $this->sendSSE('progress', ['step' => 2, 'message' => '简历解析成功，开始AI分析']);

            // 步骤2: AI分析
            $analysis = $this->aiAnalyzer->analyzeWithCallback($text, function($progress) {
                $this->sendSSE('progress', $progress);
            });

            if (!$analysis) {
                $this->sendSSE('error', ['msg' => 'AI分析失败']);
                return;
            }

            // 发送完成事件
            $this->sendSSE('complete', ['data' => $analysis]);

        } catch (\Exception $e) {
            $this->sendSSE('error', ['msg' => '分析失败: ' . $e->getMessage()]);
        }
    }

    /**
     * 发送SSE事件
     */
    private function sendSSE($event, $data)
    {
        echo "event: $event\n";
        echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
        ob_flush();
        flush();
    }

    /**
     * 返回 JSON 响应
     */
    private function json($data)
    {
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}
