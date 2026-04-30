<?php

namespace App\Service;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;

/**
 * 智谱AI文件解析服务
 * 文档: https://docs.bigmodel.cn/cn/guide/tools/file-parser
 */
class FileParserService
{
    private $client;
    private $apiKey;
    private $apiBaseUrl;

    public function __construct()
    {
        $this->client = HttpClient::create();
        // 兼容不同环境的 env() 函数
        $this->apiKey = $this->getEnv('AI_API_KEY', '');
        $this->apiBaseUrl = 'https://open.bigmodel.cn/api/paas/v4/files/parser';
    }

    /**
     * 获取环境变量（兼容不同环境）
     */
    private function getEnv(string $key, $default = '')
    {
        // 优先从 $_ENV 获取
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }

        // 从 getenv() 获取
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }

        // 如果 env() 函数存在，使用它
        if (function_exists('env')) {
            return env($key, $default);
        }

        return $default;
    }

    /**
     * 解析文件（使用智谱AI文件解析服务）
     *
     * @param string $filePath 本地文件路径
     * @param string $toolType 解析工具类型: lite, expert, prime
     * @return string|null 解析后的文本内容，失败返回null
     */
    public function parseFile(string $filePath, string $toolType = 'lite'): ?string
    {
        if (empty($this->apiKey)) {
            error_log('AI_API_KEY 未配置，回退到本地解析');
            return null;
        }

        if (!file_exists($filePath)) {
            error_log('文件不存在: ' . $filePath);
            return null;
        }

        try {
            // 1. 创建解析任务
            $taskId = $this->createParserTask($filePath, $toolType);
            if (!$taskId) {
                return null;
            }

            // 2. 轮询获取结果
            $result = $this->waitForResult($taskId, 'text');
            if (!$result) {
                return null;
            }

            // 3. 提取文本内容
            return $this->extractText($result);

        } catch (\Exception $e) {
            error_log('智谱AI文件解析失败: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 创建文件解析任务
     *
     * @param string $FilePath 文件路径
     * @param string $toolType 工具类型
     * @return string|null 任务ID
     */
    private function createParserTask(string $filePath, string $toolType): ?string
    {
        try {
            // 获取文件类型
            $fileExt = strtoupper(pathinfo($filePath, PATHINFO_EXTENSION));
            $allowedTypes = ['PDF', 'DOCX', 'DOC', 'XLS', 'XLSX', 'PPT', 'PPTX', 'PNG', 'JPG', 'JPEG', 'CSV', 'TXT', 'MD'];

            if (!in_array($fileExt, $allowedTypes)) {
                error_log('不支持的文件类型: ' . $fileExt);
                return null;
            }

            // 检查文件大小
            $fileSize = filesize($filePath);
            $maxSize = 50 * 1024 * 1024; // Lite模式最大50MB

            if ($fileSize > $maxSize) {
                error_log('文件大小超过限制: ' . ($fileSize / 1024 / 1024) . 'MB');
                return null;
            }

            // 创建multipart请求
            $curlFile = new \CURLFile($filePath, mime_content_type($filePath), basename($filePath));

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $this->apiBaseUrl . '/create',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $this->apiKey
                ],
                CURLOPT_POSTFIELDS => [
                    'file' => $curlFile,
                    'tool_type' => $toolType,
                    'file_type' => $fileExt
                ],
                CURLOPT_TIMEOUT => 60,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                error_log('HTTP请求失败: ' . $error);
                return null;
            }

            if ($httpCode !== 200) {
                error_log('创建解析任务失败，HTTP ' . $httpCode . ': ' . $response);
                return null;
            }

            $result = json_decode($response, true);
            if (isset($result['task_id'])) {
                return $result['task_id'];
            }

            error_log('创建解析任务失败: ' . $response);
            return null;

        } catch (\Exception $e) {
            error_log('创建解析任务异常: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 等待解析结果
     *
     * @param string $taskId 任务ID
     * @param string $formatType 结果格式类型: text, download_link
     * @param int $maxWaitSeconds 最大等待时间（秒）
     * @return array|null 解析结果
     */
    private function waitForResult(string $taskId, string $formatType, int $maxWaitSeconds = 60): ?array
    {
        $startTime = time();
        $interval = 2; // 每2秒查询一次

        while ((time() - $startTime) < $maxWaitSeconds) {
            try {
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $this->apiBaseUrl . '/result/' . $taskId . '/' . $formatType,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPGET => true,
                    CURLOPT_HTTPHEADER => [
                        'Authorization: Bearer ' . $this->apiKey
                    ],
                    CURLOPT_TIMEOUT => 10,
                ]);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200) {
                    $result = json_decode($response, true);

                    // 检查任务状态
                    if (isset($result['status'])) {
                        if ($result['status'] === 'success' || $result['status'] === 'completed') {
                            return $result;
                        } elseif ($result['status'] === 'processing' || $result['status'] === 'pending') {
                            // 继续等待
                            sleep($interval);
                            continue;
                        } elseif ($result['status'] === 'failed') {
                            error_log('解析任务失败: ' . ($result['error'] ?? '未知错误'));
                            return null;
                        }
                    }

                    // 如果返回数据中有内容，视为成功
                    if (isset($result['data'])) {
                        return $result;
                    }
                } elseif ($httpCode === 202) {
                    // 处理中
                    sleep($interval);
                    continue;
                } else {
                    error_log('查询解析结果失败，HTTP ' . $httpCode . ': ' . $response);
                    return null;
                }

            } catch (\Exception $e) {
                error_log('查询解析结果异常: ' . $e->getMessage());
                sleep($interval);
            }
        }

        error_log('等待解析结果超时');
        return null;
    }

    /**
     * 从解析结果中提取文本
     *
     * @param array $result 解析结果
     * @return string 提取的文本
     */
    private function extractText(array $result): string
    {
        // 根据实际API响应结构提取文本
        if (isset($result['data']['content'])) {
            return $result['data']['content'];
        }

        if (isset($result['data']['text'])) {
            return $result['data']['text'];
        }

        if (isset($result['content'])) {
            return $result['content'];
        }

        if (isset($result['text'])) {
            return $result['text'];
        }

        // 如果返回的是Markdown格式
        if (isset($result['data']['markdown'])) {
            return $result['data']['markdown'];
        }

        return '';
    }

    /**
     * 清理解析后的文本
     */
    public function cleanParsedText(string $text): string
    {
        // 确保UTF-8编码
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

        // 移除控制字符，但保留换行符
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // 标准化换行符
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // 移除连续的空行，保留最多两个换行
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        // 清理每行首尾空白
        $lines = explode("\n", $text);
        $lines = array_map(function($line) {
            return trim($line);
        }, $lines);

        // 移除空行
        $lines = array_filter($lines, function($line) {
            return !empty($line);
        });

        // 重新组合文本
        $text = implode("\n", $lines);

        return trim($text);
    }
}
