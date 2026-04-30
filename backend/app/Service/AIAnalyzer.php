<?php

namespace App\Service;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;

/**
 * AI 分析服务 (GLM-4.7)
 */
class AIAnalyzer
{
    private $client;
    private $apiKey;
    private $apiUrl;
    private $model;

    public function __construct()
    {
        $this->client = HttpClient::create();
        $this->apiKey = $this->getEnv('AI_API_KEY', '');
        // 使用Chat API端点（适用于简历分析等通用场景）
        // 注意：不要使用Coding API端点 (/api/coding/paas/v4)，那是专门用于代码生成的
        $this->apiUrl = $this->getEnv('AI_API_URL', 'https://open.bigmodel.cn/api/paas/v4');
        $this->model = $this->getEnv('AI_MODEL', 'glm-4-plus');
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
     * 分析简历内容
     */
    public function analyze(string $resumeText): array
    {
        return $this->analyzeWithCallback($resumeText, null);
    }

    /**
     * 分析简历内容（支持进度回调）
     *
     * @param string $resumeText 简历文本
     * @param callable|null $callback 进度回调函数 callback($progress)
     * @return array 分析结果
     */
    public function analyzeWithCallback(string $resumeText, ?callable $callback = null): array
    {
        if (empty($this->apiKey)) {
            if ($callback) $callback(['step' => 3, 'message' => '使用Mock数据（未配置API Key）']);
            return $this->getMockAnalysis();
        }

        try {
            if ($callback) {
                $callback(['step' => 2, 'message' => '正在发送请求到AI服务...']);
            }

            $prompt = $this->buildAnalysisPrompt($resumeText);

            $response = $this->client->request('POST', $this->apiUrl . '/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 4000,
                ],
                'timeout' => 120, // 2分钟超时
            ]);

            if ($callback) {
                $callback(['step' => 3, 'message' => 'AI分析完成，正在解析结果...']);
            }

            $content = $response->getContent();
            $result = json_decode($content, true);

            if (isset($result['choices'][0]['message']['content'])) {
                $analysisText = $result['choices'][0]['message']['content'];
                $parsedResult = $this->parseAnalysisResult($analysisText);

                if ($callback) {
                    $callback(['step' => 4, 'message' => '分析完成！']);
                }

                return $parsedResult;
            }

            return $this->getMockAnalysis();

        } catch (ExceptionInterface $e) {
            error_log('AI API 调用失败: ' . $e->getMessage());
            if ($callback) {
                $callback(['step' => 3, 'message' => 'AI服务调用失败，使用Mock数据']);
            }
            return $this->getMockAnalysis();
        }
    }

    /**
     * 生成面试问题
     */
    public function generateQuestions(array $analysis): array
    {
        if (empty($this->apiKey)) {
            return $this->getMockQuestions();
        }

        try {
            $prompt = $this->buildQuestionPrompt($analysis);

            $response = $this->client->request('POST', $this->apiUrl . '/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.8,
                    'max_tokens' => 2000,
                ]
            ]);

            $content = $response->getContent();
            $result = json_decode($content, true);

            if (isset($result['choices'][0]['message']['content'])) {
                $questionsText = $result['choices'][0]['message']['content'];
                return $this->parseQuestions($questionsText);
            }

            return $this->getMockQuestions();

        } catch (ExceptionInterface $e) {
            error_log('AI API 调用失败: ' . $e->getMessage());
            return $this->getMockQuestions();
        }
    }

    /**
     * 构建分析提示词
     */
    private function buildAnalysisPrompt(string $resumeText): string
    {
        return "你是一位资深的游戏行业招聘专家和简历分析师。请仔细阅读并分析以下简历，提取所有关键信息并进行专业评估。

【简历原文】
{$resumeText}

【分析要求】
请严格按照以下JSON格式返回分析结果，确保信息提取准确、完整、详细：

{
  \"personal_info\": {
    \"name\": \"候选人全名（必须提取）\",
    \"contact\": \"手机号码或电话（必须提取）\",
    \"email\": \"电子邮箱地址（必须提取）\",
    \"location\": \"所在城市（可选）\",
    \"age\": \"年龄（如果提及）\",
    \"gender\": \"性别（如果提及）\"
  },
  \"education\": [
    {
      \"school\": \"学校全称\",
      \"degree\": \"学位（博士/硕士/本科/大专/高中）\",
      \"major\": \"专业名称\",
      \"graduation_year\": \"毕业年份（YYYY格式）\",
      \"gpa\": \"GPA或成绩（如果提及）\"
    }
  ],
  \"work_experience\": [
    {
      \"company\": \"公司全称\",
      \"position\": \"职位名称\",
      \"duration\": \"工作时间（如：2020.06-2023.08）\",
      \"duration_months\": \"工作月数（计算总月数）\",
      \"industry\": \"所属行业（特别标注是否游戏行业）\",
      \"responsibilities\": [
        \"具体职责1（详细描述）\",
        \"具体职责2（详细描述）\"
      ],
      \"achievements\": [
        \"工作成就1（量化数据优先）\",
        \"工作成就2（量化数据优先）\"
      ],
      \"tech_stack\": [\"使用的技术栈\"]
    }
  ],
  \"skills\": {
    \"programming_languages\": [
      {\"name\": \"语言名称\", \"level\": \"熟练度（精通/熟练/掌握/了解）\", \"experience\": \"使用年限（年）\"}
    ],
    \"game_engines\": [
      {\"name\": \"引擎名称\", \"level\": \"熟练度\", \"projects\": \"相关项目数\"}
    ],
    \"tools\": [\"开发工具、版本控制、项目管理工具等\"],
    \"domains\": [
      {\"name\": \"领域（如：客户端/服务端/美术/策划）\", \"level\": \"专业程度\"}
    ],
    \"other_skills\": [\"其他重要技能\"]
  },
  \"projects\": [
    {
      \"name\": \"项目名称\",
      \"role\": \"担任角色\",
      \"duration\": \"项目周期\",
      \"description\": \"项目简介\",
      \"contributions\": [\"具体贡献1\", \"具体贡献2\"],
      \"technologies\": [\"使用的技术\"],
      \"achievements\": \"项目成果（量化数据）\"
    }
  ],
  \"skill_matching\": {
    \"score\": 85,
    \"analysis\": \"技能匹配度详细分析（2-3句话）\",
    \"matched_skills\": [
      {\"skill\": \"技能名称\", \"relevance\": \"高度相关/相关/一般\"}
    ],
    \"missing_skills\": [
      {\"skill\": \"缺失技能\", \"importance\": \"重要/次要\"}
    ]
  },
  \"experience_analysis\": {
    \"game_industry_years\": 3,
    \"game_industry_companies\": [\"游戏公司名称列表\"],
    \"total_projects\": 5,
    \"game_projects\": 3,
    \"leadership_experience\": true,
    \"team_size\": \"团队规模（如：带领10人团队）\",
    \"achievements\": [
      \"职业生涯重要成就1（量化）\",
      \"职业生涯重要成就2（量化）\"
    ],
    \"career_progression\": \"职业发展轨迹分析（2-3句话）\"
  },
  \"education_assessment\": {
    \"degree_level\": \"博士/硕士/本科/大专/高中\",
    \"major_relevance\": \"专业相关性（高度相关/相关/一般/不相关）\",
    \"school_level\": \"院校层次（985/211/普通本科/其他）\",
    \"score\": 80,
    \"analysis\": \"学历背景评估分析（2-3句话）\"
  },
  \"potential_prediction\": {
    \"score\": 85,
    \"strengths\": [
      {\"area\": \"优势领域\", \"description\": \"具体描述\"}
    ],
    \"weaknesses\": [
      {\"area\": \"不足领域\", \"description\": \"具体描述\", \"improvement\": \"改进建议\"}
    ],
    \"development_potential\": \"高/中/低\",
    \"suitable_positions\": [\"适合的职位1\", \"适合的职位2\"],
    \"analysis\": \"综合发展潜力分析（3-4句话）\"
  },
  \"recommendations\": [
    \"面试建议1（具体可操作）\",
    \"面试建议2（具体可操作）\",
    \"背景调查重点（如果需要）\"
  ],
  \"summary\": {
    \"overall_evaluation\": \"总体评价（3-4句话，客观全面）\",
    \"key_highlights\": [\"核心亮点1\", \"核心亮点2\", \"核心亮点3\"],
    \"risk_factors\": [\"潜在风险1\", \"潜在风险2\"],
    \"hire_recommendation\": \"强烈推荐/推荐/可以考虑/不推荐\",
    \"salary_range\": \"建议薪资范围（如果可推测）\"
  }
}

【重要提示】
1. 必须返回纯JSON格式，不要包含任何markdown代码块标记（如```json）
2. 如果某些信息在简历中未提及，使用空字符串\"\"或null，不要编造
3. 数值信息尽可能量化，如工作年限、项目数量、团队规模等
4. 日期统一使用标准格式，如YYYY.MM或YYYY-MM
5. 分析性文字要客观、专业、有针对性
6. 对于游戏行业经验，要特别标注和详细分析
7. 技能评估要结合项目经验和年限，不能只凭技能名称判断";
    }

    /**
     * 构建问题生成提示词
     */
    private function buildQuestionPrompt(array $analysis): string
    {
        $analysisJson = json_encode($analysis, JSON_UNESCAPED_UNICODE);

        return "基于以下简历分析结果，生成5-8个有针对性的面试问题，帮助面试官深入了解候选人的能力和经验。

简历分析结果：
{$analysisJson}

请按照以下JSON格式返回问题（不要添加任何其他文字）：

[
  {
    \"category\": \"技术能力\",
    \"question\": \"问题内容\",
    \"purpose\": \"提问目的\",
    \"key_points\": [\"要点1\", \"要点2\"]
  }
]

问题类型包括：
1. 技术能力问题：深入了解编程语言、引擎、工具的使用经验
2. 项目经验问题：了解项目中的具体贡献和解决的技术难题
3. 行业认知问题：了解对游戏行业的理解和热情
4. 学习能力问题：了解学习新技术的能力和方法

请确保返回的是有效的JSON格式。";
    }

    /**
     * 解析分析结果
     */
    private function parseAnalysisResult(string $text): array
    {
        // 尝试提取 JSON
        if (preg_match('/\{[\s\S]*\}/', $text, $matches)) {
            $json = json_decode($matches[0], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $json;
            }
        }

        return $this->getMockAnalysis();
    }

    /**
     * 解析问题列表
     */
    private function parseQuestions(string $text): array
    {
        // 尝试提取 JSON
        if (preg_match('/\[[\s\S]*\]/', $text, $matches)) {
            $json = json_decode($matches[0], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $json;
            }
        }

        return $this->getMockQuestions();
    }

    /**
     * 获取模拟分析结果（用于测试）
     */
    private function getMockAnalysis(): array
    {
        return [
            'personal_info' => [
                'name' => '张三',
                'contact' => '13800138000',
                'email' => 'zhangsan@example.com'
            ],
            'education' => [
                [
                    'school' => '某某大学',
                    'degree' => '本科',
                    'major' => '计算机科学与技术',
                    'graduation_year' => '2020'
                ]
            ],
            'work_experience' => [
                [
                    'company' => '某某游戏公司',
                    'position' => '游戏客户端开发工程师',
                    'duration' => '2020-2023',
                    'responsibilities' => [
                        '负责游戏核心功能开发',
                        '优化游戏性能',
                        '参与技术方案设计'
                    ]
                ]
            ],
            'skills' => [
                'programming_languages' => ['C++', 'C#', 'Python', 'Lua'],
                'game_engines' => ['Unity', 'Unreal Engine'],
                'tools' => ['Git', 'JIRA', 'Visual Studio'],
                'other_skills' => ['算法设计', '性能优化', '团队协作']
            ],
            'skill_matching' => [
                'score' => 85,
                'matched_skills' => ['C++', 'Unity', '性能优化'],
                'missing_skills' => ['网络编程', '图形学']
            ],
            'experience_analysis' => [
                'game_industry_years' => 3,
                'projects_count' => 5,
                'leadership_experience' => true,
                'achievements' => [
                    '主导开发上线3款手游',
                    '优化游戏性能提升30%',
                    '获得公司优秀员工奖'
                ]
            ],
            'education_assessment' => [
                'degree_level' => '本科',
                'major_relevance' => '相关',
                'score' => 80
            ],
            'potential_prediction' => [
                'score' => 85,
                'strengths' => [
                    '扎实的编程基础',
                    '丰富的游戏开发经验',
                    '良好的团队协作能力'
                ],
                'weaknesses' => [
                    '缺乏大型项目架构经验',
                    '图形学深度不够'
                ],
                'development_potential' => '高'
            ],
            'recommendations' => [
                '建议重点考察其在项目中的实际贡献',
                '可深入了解其对游戏性能优化的理解',
                '建议评估其学习能力和适应性'
            ]
        ];
    }

    /**
     * 获取模拟问题（用于测试）
     */
    private function getMockQuestions(): array
    {
        return [
            [
                'category' => '技术能力',
                'question' => '请详细描述你在Unity中遇到的最具挑战性的性能问题，以及你是如何解决的？',
                'purpose' => '了解候选人的问题解决能力和性能优化经验',
                'key_points' => ['问题识别', '分析方法', '解决方案', '效果评估']
            ],
            [
                'category' => '项目经验',
                'question' => '在你主导开发的3款手游中，哪一款的技术挑战最大？你在其中承担了什么角色？',
                'purpose' => '了解候选人的项目经验和实际贡献',
                'key_points' => ['项目规模', '技术难点', '个人职责', '团队协作']
            ],
            [
                'category' => '行业认知',
                'question' => '你认为当前移动游戏行业面临的最大技术挑战是什么？',
                'purpose' => '了解候选人对行业趋势的理解',
                'key_points' => ['行业认知', '技术趋势', '思考深度']
            ],
            [
                'category' => '学习能力',
                'question' => '请分享一个你最近学习的新技术或工具，以及你如何将其应用到工作中？',
                'purpose' => '评估候选人的学习能力和应用能力',
                'key_points' => ['学习方法', '应用实践', '效果体现']
            ]
        ];
    }
}
