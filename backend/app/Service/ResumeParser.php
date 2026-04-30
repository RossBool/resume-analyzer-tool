<?php

namespace App\Service;

use Smalot\PdfParser\Parser as PdfParser;
use PhpOffice\PhpWord\IOFactory;

/**
 * 简历解析服务
 * 优先使用智谱AI文件解析API，回退到本地解析
 */
class ResumeParser
{
    private $fileParserService;

    public function __construct()
    {
        $this->fileParserService = new FileParserService();
    }

    /**
     * 解析简历文件，提取文本内容
     */
    public function parse(string $filePath): ?string
    {
        if (!file_exists($filePath)) {
            return null;
        }

        $fileExt = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        // 优先使用智谱AI文件解析服务
        $aiParsedText = $this->parseWithAI($filePath, $fileExt);
        if ($aiParsedText && !empty($aiParsedText)) {
            error_log('使用智谱AI文件解析成功');
            return $this->cleanTextAdvanced($aiParsedText);
        }

        // 回退到本地解析
        error_log('智谱AI解析失败，回退到本地解析');
        switch ($fileExt) {
            case 'pdf':
                return $this->parsePdf($filePath);
            case 'doc':
            case 'docx':
                return $this->parseWord($filePath);
            default:
                return null;
        }
    }

    /**
     * 使用智谱AI文件解析服务
     */
    private function parseWithAI(string $filePath, string $fileExt): ?string
    {
        try {
            // 使用Lite模式（免费，速度快）
            $text = $this->fileParserService->parseFile($filePath, 'lite');

            if ($text) {
                return $this->fileParserService->cleanParsedText($text);
            }

            return null;

        } catch (\Exception $e) {
            error_log('智谱AI文件解析异常: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 解析 PDF 文件
     */
    private function parsePdf(string $filePath): ?string
    {
        try {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();

            // 更详细的清理文本，保留结构信息
            return $this->cleanTextAdvanced($text);

        } catch (\Exception $e) {
            error_log('PDF 解析失败: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 解析 Word 文件
     */
    private function parseWord(string $filePath): ?string
    {
        try {
            $phpWord = IOFactory::load($filePath);

            $text = '';
            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $elementText = $element->getText();
                        // 保留段落结构
                        if (!empty(trim($elementText))) {
                            $text .= trim($elementText) . "\n";
                        }
                    }
                }
            }

            // 更详细的清理文本，保留结构信息
            return $this->cleanTextAdvanced($text);

        } catch (\Exception $e) {
            error_log('Word 解析失败: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 清理文本内容
     */
    private function cleanText(string $text): string
    {
        // 移除多余的空白字符
        $text = preg_replace('/\s+/', ' ', $text);

        // 移除特殊字符
        $text = preg_replace('/[\x00-\x1F\x7F]/', '', $text);

        // 转换为 UTF-8
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

        return trim($text);
    }

    /**
     * 高级文本清理，保留简历结构信息
     */
    private function cleanTextAdvanced(string $text): string
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

        // 修复常见的PDF解析错误
        $text = str_replace(' ，', '，', $text);  // 中文逗号前空格
        $text = str_replace(' 。', '。', $text);  // 中文句号前空格
        $text = str_replace(' 、', '、', $text);  // 中文顿号前空格
        $text = str_replace('： ', '：', $text);  // 中文冒号后空格
        $text = str_replace('（ ', '（', $text);  // 中文左括号后空格
        $text = str_replace(' ）', '）', $text);  // 中文右括号前空格

        // 修复断开的词（如：电 话 -> 电话）
        $text = preg_replace('/([a-zA-Z])\s+([a-zA-Z])/', '$1$2', $text);  // 英文单词
        $text = preg_replace('/(\d)\s+([年月日])/', '$1$2', $text);  // 数字+时间单位
        $text = preg_replace('/([年月日])\s+(\d)/', '$1$2', $text);  // 时间单位+数字

        // 移除页眉页脚等无关内容（常见模式）
        $patterns = [
            '/第\s*\d+\s*页\s*\/\s*共\s*\d+\s*页/',
            '/Page\s*\d+\s*of\s*\d+/i',
            '/^\s*\d+\s*$/m',  // 单独的页码
        ];
        $text = preg_replace($patterns, '', $text);

        // 再次清理多余空行
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
    }
}
