/**
 * 简历文本预处理工具
 * 优化长文本输入，提高分析效率和准确性
 */

/**
 * 方案1: 智能分段处理
 * 将长文本分成逻辑段落，分别处理后再合并
 */
export class SegmentProcessor {
  constructor(maxSegmentLength = 2000) {
    this.maxSegmentLength = maxSegmentLength
  }

  /**
   * 智能分割文本（按段落保持语义完整性）
   */
  segmentText(text) {
    // 按段落分割
    const paragraphs = text.split(/\n\n+/)
    const segments = []
    let currentSegment = ''

    for (const para of paragraphs) {
      // 如果单个段落超过最大长度，强制分割
      if (para.length > this.maxSegmentLength) {
        if (currentSegment) {
          segments.push(currentSegment.trim())
          currentSegment = ''
        }
        // 继续分割长段落
        const chunks = this.splitLongParagraph(para)
        segments.push(...chunks)
        continue
      }

      // 检查是否需要开始新的段落
      if (currentSegment.length + para.length > this.maxSegmentLength) {
        if (currentSegment) {
          segments.push(currentSegment.trim())
        }
        currentSegment = para
      } else {
        currentSegment += (currentSegment ? '\n\n' : '') + para
      }
    }

    if (currentSegment) {
      segments.push(currentSegment.trim())
    }

    return segments
  }

  /**
   * 分割过长的段落
   */
  splitLongParagraph(para) {
    const chunks = []
    const sentences = para.match(/[^。！？.!?]+[。！？.!?]*/g) || [para]
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.maxSegmentLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = sentence
      } else {
        currentChunk += sentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  /**
   * 合并分段分析结果
   */
  mergeResults(results) {
    // 合并策略：取最完整的分析结果
    // 优先保留非空字段
    const merged = {}

    for (const result of results) {
      if (!result || typeof result !== 'object') continue

      for (const [key, value] of Object.entries(result)) {
        if (value === null || value === undefined || value === '') {
          continue
        }

        // 特殊处理数组字段
        if (Array.isArray(value)) {
          if (!merged[key]) {
            merged[key] = value
          } else {
            // 合并数组，去重
            const existing = new Set(merged[key].map(v => JSON.stringify(v)))
            value.forEach(item => {
              if (!existing.has(JSON.stringify(item))) {
                merged[key].push(item)
              }
            })
          }
        }
        // 特殊处理对象字段
        else if (typeof value === 'object') {
          if (!merged[key]) {
            merged[key] = { ...value }
          } else {
            merged[key] = { ...merged[key], ...value }
          }
        }
        // 基础类型字段：保留第一个非空值
        else {
          if (!merged[key]) {
            merged[key] = value
          }
        }
      }
    }

    return merged
  }
}

/**
 * 方案2: 关键信息提取
 * 基于关键词和正则表达式提取最相关的部分
 */
export class KeywordExtractor {
  constructor() {
    // 简历关键模式
    this.patterns = {
      // 个人信息
      personalInfo: [
        /姓名[::：]\s*([^\n]+)/i,
        /联系[电话方式]+[::：]\s*([^\n]+)/i,
        /邮箱[::：]\s*([^\n]+)/i,
        /年龄[::：]\s*([^\n]+)/i,
        /性别[::：]\s*([^\n]+)/i,
      ],

      // 教育背景
      education: [
        /教育[经历背景]+/i,
        /学历/i,
        /毕业院校/i,
        /专业/i,
        /学位/i,
        /\d{4}\.\d{2}\s*-\s*\d{4}\.\d{2}\s*(本科|硕士|博士|研究生|大学|学院)/i,
      ],

      // 工作经验
      workExperience: [
        /工作[经验经历]+/i,
        /项目经验/i,
        /实习经历/i,
        /公司[::：]/i,
        /职位[::：]/i,
        /\d{4}\.\d{2}\s*-\s*\d{4}\.\d{2}/i,
      ],

      // 技能
      skills: [
        /技能[特长清单]+/i,
        /专业[技能]+/i,
        /技术栈/i,
        /编程语言/i,
        /开发工具/i,
        /框架/i,
      ],

      // 项目经验
      projects: [
        /项目[经验介绍]+/i,
        /负责/i,
        /参与/i,
        /完成/i,
      ],

      // 成就
      achievements: [
        /成就[业绩效果]+/i,
        /获奖/i,
        /荣誉/i,
        /证书/i,
      ]
    }
  }

  /**
   * 提取关键段落
   */
  extractRelevantSections(text) {
    const lines = text.split('\n')
    const relevantSections = []
    let currentSection = []
    let inRelevantSection = false

    for (const line of lines) {
      // 检查是否匹配任何模式
      const isMatch = this.matchesPattern(line)

      if (isMatch) {
        inRelevantSection = true
        if (currentSection.length > 0) {
          relevantSections.push(currentSection.join('\n'))
        }
        currentSection = [line]
      } else if (inRelevantSection) {
        // 继续收集相关段落
        currentSection.push(line)

        // 如果遇到空行且已有内容，可能是一个section结束
        if (line.trim() === '' && currentSection.length > 2) {
          relevantSections.push(currentSection.join('\n'))
          currentSection = []
          inRelevantSection = false
        }
      }
    }

    if (currentSection.length > 0) {
      relevantSections.push(currentSection.join('\n'))
    }

    return relevantSections.join('\n\n')
  }

  /**
   * 检查是否匹配任何模式
   */
  matchesPattern(line) {
    for (const patternGroup of Object.values(this.patterns)) {
      for (const pattern of patternGroup) {
        if (pattern.test(line)) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 提取关键信息（结构化）
   */
  extractKeyInfo(text) {
    const info = {
      personalInfo: this.extractByPatterns(text, this.patterns.personalInfo),
      education: this.extractSections(text, this.patterns.education),
      workExperience: this.extractSections(text, this.patterns.workExperience),
      skills: this.extractSections(text, this.patterns.skills),
      projects: this.extractSections(text, this.patterns.projects),
      achievements: this.extractSections(text, this.patterns.achievements),
    }

    return info
  }

  extractByPatterns(text, patterns) {
    const results = []
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        results.push(matches.join(': '))
      }
    }
    return results
  }

  extractSections(text, patterns) {
    const lines = text.split('\n')
    const sections = []

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          // 收集该section的内容
          const section = [lines[i]]
          for (let j = i + 1; j < lines.length && j < i + 20; j++) {
            if (lines[j].trim() === '') break
            section.push(lines[j])
          }
          sections.push(section.join('\n'))
        }
      }
    }

    return sections
  }
}

/**
 * 方案3: 智能摘要
 * 提取关键信息，压缩文本长度
 */
export class TextSummarizer {
  constructor(maxLength = 3000) {
    this.maxLength = maxLength
    this.keywordExtractor = new KeywordExtractor()
  }

  /**
   * 生成简历摘要
   */
  summarize(text) {
    // 1. 提取结构化信息
    const keyInfo = this.keywordExtractor.extractKeyInfo(text)

    // 2. 构建摘要
    const summaryParts = []

    // 个人信息
    if (keyInfo.personalInfo.length > 0) {
      summaryParts.push('【个人信息】\n' + keyInfo.personalInfo.join('\n'))
    }

    // 教育背景（保留最相关的2-3条）
    if (keyInfo.education.length > 0) {
      summaryParts.push('【教育背景】\n' + keyInfo.education.slice(0, 2).join('\n\n'))
    }

    // 工作经验（保留最近2-3份）
    if (keyInfo.workExperience.length > 0) {
      summaryParts.push('【工作经验】\n' + keyInfo.workExperience.slice(0, 3).join('\n\n'))
    }

    // 技能（提取所有）
    if (keyInfo.skills.length > 0) {
      summaryParts.push('【技能】\n' + keyInfo.skills.join('\n\n'))
    }

    // 项目经验（保留前3个）
    if (keyInfo.projects.length > 0) {
      summaryParts.push('【项目经验】\n' + keyInfo.projects.slice(0, 3).join('\n\n'))
    }

    let summary = summaryParts.join('\n\n---\n\n')

    // 3. 如果仍然过长，进行裁剪
    if (summary.length > this.maxLength) {
      summary = this.truncateSmartly(summary, this.maxLength)
    }

    return summary
  }

  /**
   * 智能裁剪文本
   */
  truncateSmartly(text, maxLength) {
    if (text.length <= maxLength) return text

    // 计算每个部分应该保留的长度
    const parts = text.split('\n\n---\n\n')
    const partLength = Math.floor(maxLength / parts.length)

    const truncatedParts = parts.map(part => {
      if (part.length <= partLength) return part

      // 保留标题和前半部分
      const lines = part.split('\n')
      const title = lines[0]
      let content = lines.slice(1).join('\n')

      // 按句子裁剪
      const sentences = content.match(/[^。！？.!?]+[。！？.!?]*/g) || []
      let truncatedContent = ''

      for (const sentence of sentences) {
        if ((title + '\n' + truncatedContent + sentence).length > partLength) {
          break
        }
        truncatedContent += sentence
      }

      return title + '\n' + truncatedContent + '\n...'
    })

    return truncatedParts.join('\n\n---\n\n')
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    const keywords = new Set()

    // 技术关键词
    const techKeywords = text.match(/(Java|Python|PHP|JavaScript|Vue|React|Angular|Node\.js|MySQL|Redis|Linux|Git|Docker|AWS|阿里云|腾讯云)/gi)
    if (techKeywords) {
      techKeywords.forEach(kw => keywords.add(kw))
    }

    // 行业关键词
    const industryKeywords = text.match(/(游戏|金融|电商|教育|医疗|互联网|人工智能|大数据|云计算)/gi)
    if (industryKeywords) {
      industryKeywords.forEach(kw => keywords.add(kw))
    }

    // 职位关键词
    const positionKeywords = text.match(/(工程师|架构师|主管|经理|总监|负责人|开发|设计师|产品经理)/gi)
    if (positionKeywords) {
      positionKeywords.forEach(kw => keywords.add(kw))
    }

    return Array.from(keywords)
  }
}

/**
 * 综合处理器
 * 根据文本长度自动选择最佳处理策略
 */
export class ResumeTextProcessor {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 4000
    this.segmentProcessor = new SegmentProcessor(options.maxSegmentLength || 2000)
    this.keywordExtractor = new KeywordExtractor()
    this.summarizer = new TextSummarizer(options.summaryMaxLength || 3000)
  }

  /**
   * 处理简历文本（自动选择策略）
   */
  process(text) {
    const textLength = text.length

    // 短文本：直接返回
    if (textLength <= this.maxLength) {
      return {
        strategy: 'direct',
        processedText: text,
        metadata: {
          originalLength: textLength,
          processedLength: textLength,
          compressionRatio: 1
        }
      }
    }

    // 中等长度：使用智能摘要
    if (textLength <= this.maxLength * 1.5) {
      const summarized = this.summarizer.summarize(text)
      return {
        strategy: 'summarize',
        processedText: summarized,
        metadata: {
          originalLength: textLength,
          processedLength: summarized.length,
          compressionRatio: (summarized.length / textLength).toFixed(2),
          keywords: this.summarizer.extractKeywords(text)
        }
      }
    }

    // 长文本：使用分段处理
    const segments = this.segmentProcessor.segmentText(text)
    const summarized = this.summarizer.summarize(text)

    return {
      strategy: 'segment',
      processedText: summarized, // 先用摘要，如果需要分段再使用segments
      segments: segments,
      metadata: {
        originalLength: textLength,
        processedLength: summarized.length,
        segmentCount: segments.length,
        compressionRatio: (summarized.length / textLength).toFixed(2),
        keywords: this.summarizer.extractKeywords(text)
      }
    }
  }

  /**
   * 检测文本是否需要处理
   */
  needsProcessing(text) {
    return text.length > this.maxLength
  }
}

// 导出便捷函数
export function processResumeText(text, options = {}) {
  const processor = new ResumeTextProcessor(options)
  return processor.process(text)
}

export function extractKeywords(text) {
  const summarizer = new TextSummarizer()
  return summarizer.extractKeywords(text)
}

export function extractKeySections(text) {
  const extractor = new KeywordExtractor()
  return extractor.extractRelevantSections(text)
}

export default {
  SegmentProcessor,
  KeywordExtractor,
  TextSummarizer,
  ResumeTextProcessor,
  processResumeText,
  extractKeywords,
  extractKeySections
}
