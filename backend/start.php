<?php
/**
 * 启动文件
 */
// 加载辅助函数
require_once __DIR__ . '/support/helpers.php';

// 加载环境变量和自动加载
require_once __DIR__ . '/autoload.php';

// 启动 webman
\Webman\App::run();
