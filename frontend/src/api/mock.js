/**
 * 模拟数据 - 用于测试前端展示功能
 */

export const mockAnalysisResult = {
  personal_info: {
    name: "黎国胜",
    contact: "18813750773",
    email: "794473858@qq.com",
    location: "广州",
    age: "30岁",
    gender: "男"
  },
  education: [
    {
      school: "广州中医药大学",
      degree: "本科",
      major: "计算机科学与技术",
      graduation_year: "2017",
      gpa: ""
    }
  ],
  work_experience: [
    {
      company: "广州星邦互娱网络有限公司",
      position: "PHP",
      duration: "2021.03-2025.08",
      duration_months: 53,
      industry: "游戏行业",
      responsibilities: [
        "负责公司外放渠道的接入，制定SDK接入规范文档（含服务端/小游戏/H5），覆盖登录、支付、数据上报等核心接口，熟悉硬核小游戏接入流程等",
        "参与客服系统开发与迭代，涵盖工单系统、质检系统、用户反馈分析模块等核心功能开发",
        "负责公司运营系统需求的开发与维护、跨部门沟通了解需求的细节与推动需求的实现。处理线上玩家登录、支付等问题"
      ],
      achievements: [
        "成功接入多个外部渠道，提升渠道覆盖范围",
        "优化客服系统性能，提升用户满意度"
      ],
      tech_stack: ["PHP", "MySQL", "Redis", "Linux"]
    },
    {
      company: "上海垦丁网络科技有限公司广州分公司",
      position: "php开发",
      duration: "2018.08-2021.01",
      duration_months: 29,
      industry: "游戏行业",
      responsibilities: [
        "负责公司运营后台的维护与开发，不限于运营后台需求开发、游戏统计报表开发、安卓渠道包分包等",
        "负责智能投放后台系统开发，包括今日头条、广点通、快手等渠道的marketing api的接入，参与投放数据归属的优化工作",
        "负责解决新游戏接入中存在的问题、参与管理公司的服务器、开发运营提出来的需求等"
      ],
      achievements: [
        "完成智能投放系统开发，提升广告投放效率",
        "优化后台系统性能，支持高并发访问"
      ],
      tech_stack: ["PHP", "MySQL", "Redis", "Linux", "Marketing API"]
    },
    {
      company: "无敌汽车网",
      position: "PHP研发工程师",
      duration: "2017.07-2018.08",
      duration_months: 13,
      industry: "电商",
      responsibilities: [
        "负责网站后台CMS系统功能的开发和优化，确保系统稳定性和高效性",
        "负责赛卡系统（连锁卡丁车场馆运营系统）的开发，提升系统性能和用户体验",
        "负责改件仓库（汽车配件电商平台）的后台管理，包括商家商品的上架、交易管理、优惠券发放、运费设置及交易流水记录"
      ],
      achievements: [
        "成功开发并上线多个核心业务模块",
        "提升系统响应速度30%"
      ],
      tech_stack: ["PHP", "MySQL", "jQuery", "HTML/CSS"]
    }
  ],
  skills: {
    programming_languages: [
      { name: "PHP", level: "精通", experience: 8 }
    ],
    game_engines: [],
    tools: ["Linux", "MySQL", "Redis", "Memcached", "Git", "jQuery"],
    domains: [
      { name: "后端开发", level: "精通" },
      { name: "API开发", level: "熟练" },
      { name: "数据库设计", level: "熟练" }
    ],
    other_skills: ["ThinkPHP", "Laravel", "RESTful API"]
  },
  skill_matching: {
    score: 85,
    analysis: "候选人具备8年PHP开发经验，其中在游戏行业有多年工作经验，熟悉游戏后台系统开发、渠道接入、运营系统等核心业务。技术栈扎实，具备良好的问题解决能力和团队协作能力。",
    matched_skills: [
      { skill: "PHP开发", relevance: "高度相关" },
      { skill: "MySQL", relevance: "高度相关" },
      { skill: "Redis", relevance: "高度相关" },
      { skill: "Linux", relevance: "相关" },
      { skill: "游戏行业经验", relevance: "高度相关" }
    ],
    missing_skills: []
  },
  experience_analysis: {
    game_industry_years: 4,
    game_industry_companies: ["广州星邦互娱网络有限公司", "上海垦丁网络科技有限公司广州分公司"],
    total_projects: 8,
    game_projects: 5,
    leadership_experience: false,
    team_size: "中小型团队",
    achievements: [
      "成功接入多个外部渠道，提升渠道覆盖范围",
      "优化客服系统性能，提升用户满意度",
      "完成智能投放系统开发，提升广告投放效率",
      "优化后台系统性能，支持高并发访问"
    ],
    career_progression: "从初级PHP开发工程师成长为资深后端开发工程师，在游戏行业积累了丰富的项目经验，技术能力和业务理解能力持续提升。"
  },
  education_assessment: {
    degree_level: "本科",
    major_relevance: "相关",
    school_level: "普通本科",
    score: 75,
    analysis: "本科学历，计算机科学与技术专业，专业背景匹配度高。毕业于2017年，已有8年工作经验，理论与实践结合良好。"
  },
  potential_prediction: {
    score: 82,
    strengths: [
      { area: "技术能力", description: "8年PHP开发经验，技术栈扎实" },
      { area: "行业经验", description: "游戏行业经验丰富，了解业务流程" },
      { area: "项目经验", description: "参与过多个大型项目开发" }
    ],
    weaknesses: [
      {
        area: "前端技术",
        description: "前端技术经验相对较少，主要专注后端开发",
        improvement: "建议学习现代前端框架（如Vue、React），提升全栈能力"
      }
    ],
    development_potential: "高",
    suitable_positions: ["PHP高级工程师", "后端架构师", "技术主管"],
    analysis: "候选人有较强的技术能力和丰富的项目经验，在游戏行业有深入的理解。建议继续提升架构设计能力和团队管理能力，向技术专家或架构师方向发展。"
  },
  recommendations: [
    "重点考察候选人在游戏行业的具体项目经验和技术深度",
    "评估候选人的架构设计能力和技术规划能力",
    "了解候选人对新技术的学习和适应能力",
    "考察候选人的团队协作和沟通能力"
  ],
  summary: {
    overall_evaluation: "黎国胜是一位经验丰富的PHP开发工程师，拥有8年开发经验，其中4年游戏行业经验。技术基础扎实，熟悉后端开发和数据库设计，在游戏行业积累了丰富的项目经验。适合中高级PHP开发岗位，有向架构师发展的潜力。",
    key_highlights: [
      "8年PHP开发经验，技术扎实",
      "4年游戏行业经验，业务理解深入",
      "参与过多个大型项目，项目经验丰富",
      "熟悉渠道接入、运营系统等核心业务"
    ],
    risk_factors: [
      "前端技术经验相对较少",
      "缺乏团队管理经验"
    ],
    hire_recommendation: "推荐",
    salary_range: "18-22K"
  }
}

/**
 * 模拟流式分析（用于测试）
 */
export async function mockAnalyzeResumeStream(resumeText, callbacks) {
  const { onProgress, onComplete } = callbacks

  // 模拟逐字输出
  const resultString = JSON.stringify(mockAnalysisResult, null, 2)

  for (let i = 0; i < resultString.length; i++) {
    const chunk = resultString[i]
    onProgress?.(chunk, resultString.substring(0, i + 1))

    // 每10个字符暂停一次，模拟流式效果
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  onComplete?.(mockAnalysisResult)
}
