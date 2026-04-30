/**
 * 分析引擎 API 调用模块
 * 支持流式响应
 */

const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY || 'd5b74cb4f5ee4f42a871285eaeba947e.5kIPGbyZ1N54FvNf'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

// 是否启用模拟模式（用于调试或配额耗尽时）
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

/**
 * 调用 API（非流式）
 */
export async function callZhipuAPI(messages, model = 'glm-4', temperature = 0.7) {
  const url = API_URL

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: 4000
    })
  })

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status}`)
  }

  return await response.json()
}

/**
 * 调用 API（流式）
 * @param {Array} messages - 消息数组
 * @param {Object} callbacks - 回调函数 { onProgress, onComplete, onError }
 * @param {string} model - 模型名称
 * @param {number} temperature - 温度参数
 * @param {number} retryCount - 当前重试次数
 */
export async function callZhipuAPIStream(messages, callbacks, model = 'glm-4.7', temperature = 0.7, retryCount = 0) {
  const { onProgress, onComplete, onError } = callbacks
  const url = API_URL

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 4000,
        stream: true // 启用流式响应
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        // 429 错误：自动重试
        if (retryCount < 3) {
          const waitTime = (retryCount + 1) * 5000 // 5秒, 10秒, 15秒
          console.log(`⏳ 遇到 429 限流，${waitTime/1000}秒后重试 (${retryCount + 1}/3)...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return callZhipuAPIStream(messages, callbacks, model, temperature, retryCount + 1)
        }
        throw new Error('API 请求过于频繁，请稍后重试（建议等待 1-2 分钟）或查看 API 配额')
      }
      throw new Error(`API 调用失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = '' // 用于存储不完整的数据

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 按行分割，但保留最后一个不完整的行
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个可能不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            continue
          }

          // 跳过空行
          if (!data) {
            continue
          }

          try {
            const parsed = JSON.parse(data)
            // 只提取 content 字段，忽略 reasoning_content（推理过程）
            const content = parsed.choices?.[0]?.delta?.content || ''

            if (content) {
              fullContent += content
              onProgress?.(content, fullContent)
            }
          } catch (e) {
            // 忽略解析错误，可能是数据不完整
          }
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim()) {
      const lines = buffer.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              // 只提取 content 字段，忽略 reasoning_content（推理过程）
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                fullContent += content
                onProgress?.(content, fullContent)
              }
            } catch (e) {
              // 忽略最后的 chunk
            }
          }
        }
      }
    }

    onComplete?.(fullContent)

  } catch (error) {
    onError?.(error)
  }
}

/**
 * 尝试修复常见的 JSON 格式问题
 * @param {string} jsonString - 可能格式错误的 JSON 字符串
 * @returns {object} - 解析后的对象
 */
function tryParseJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('输入内容为空或不是字符串')
  }

  // 保存原始内容用于调试
  const original = jsonString
  let wasTruncated = false

  // 1. 去除 markdown 代码块标记和其他干扰
  let cleaned = jsonString
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^{]*({)/, '$1') // 移除开头的非JSON内容
    .trim()

  // 2. 尝试直接解析
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // 继续尝试修复
  }

  // 3. 尝试提取完整的 JSON 对象（处理嵌套括号）
  const extracted = extractCompleteJSON(cleaned)

  if (!extracted) {
    throw new Error(`无法找到有效的 JSON 对象\n接收到的内容前200字符：${original.substring(0, 200)}...`)
  }

  // 4. 尝试解析提取的内容
  try {
    return JSON.parse(extracted)
  } catch (e) {
    // 继续尝试修复
  }

  // 5. 尝试修复常见的 JSON 问题
  let fixed = extracted

  // 修复尾随逗号
  fixed = fixed.replace(/,\s*([}\]])/g, '$1')

  // 修复未引用的键名
  fixed = fixed.replace(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '{"$1":')

  // 修复单引号
  fixed = fixed.replace(/'/g, '"')

  // 修复数组问题
  fixed = fixed.replace(/\[\s*,/g, '[')
  fixed = fixed.replace(/,\s*\]/g, ']')

  // 修复缺失逗号（简单情况）
  fixed = fixed.replace(/"\s*"/g, '", "')
  fixed = fixed.replace(/}"\s*"/g, '}, "')
  fixed = fixed.replace(/]"\s*"/g, '], "')

  // 移除注释
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
  fixed = fixed.replace(/\/\/.*/g, '')

  // 检测是否被截断并智能补全
  const quotes = (fixed.match(/"/g) || []).length
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/\]/g) || []).length

  const hasUnclosedString = quotes % 2 !== 0
  const hasUnbalancedBraces = openBraces > closeBraces
  const hasUnbalancedBrackets = openBrackets > closeBrackets

  if (hasUnclosedString || hasUnbalancedBraces || hasUnbalancedBrackets) {
    wasTruncated = true
    console.warn('⚠️ 检测到返回内容被截断，尝试智能补全...')

    // 如果有未闭合的字符串，找到最后一个完整的字段并截断
    if (hasUnclosedString) {
      // 找到最后一个冒号的位置（字段值的开始）
      const lastColonIndex = fixed.lastIndexOf(':')

      if (lastColonIndex > 0) {
        // 向前找到逗号或开括号（字段的开始）
        let fieldStart = fixed.substring(0, lastColonIndex).lastIndexOf(',')
        if (fieldStart === -1) {
          fieldStart = fixed.substring(0, lastColonIndex).lastIndexOf('{')
        }

        if (fieldStart > 0) {
          // 截断到上一个字段的末尾
          fixed = fixed.substring(0, fieldStart)
        }
      }
    }

    // 补全缺失的闭合括号
    const f_openBraces = (fixed.match(/\{/g) || []).length
    const f_closeBraces = (fixed.match(/\}/g) || []).length
    const f_openBrackets = (fixed.match(/\[/g) || []).length
    const f_closeBrackets = (fixed.match(/\]/g) || []).length

    if (f_openBraces > f_closeBraces) {
      fixed += '}'.repeat(f_openBraces - f_closeBraces)
    }
    if (f_openBrackets > f_closeBrackets) {
      fixed += ']'.repeat(f_openBrackets - f_closeBrackets)
    }
  }

  // 6. 最后尝试解析
  try {
    const parsed = JSON.parse(fixed)

    // 如果检测到截断，添加警告标记
    if (wasTruncated) {
      parsed._truncated = true
      parsed._warning = '返回内容被截断，部分数据可能不完整。建议重试或精简简历内容。'
    }

    return parsed
  } catch (e) {
    // 所有修复尝试都失败，抛出错误
    const issues = []
    if (hasUnclosedString) issues.push('字符串未闭合')
    if (hasUnbalancedBraces) issues.push(`对象括号不平衡（${openBraces}个开括号 vs ${closeBraces}个闭括号）`)
    if (hasUnbalancedBrackets) issues.push(`数组括号不平衡（${openBrackets}个开括号 vs ${closeBrackets}个闭括号）`)

    throw new Error(
      `JSON 解析失败：${e.message}\n\n` +
      `检测到的问题：\n${issues.map(i => '• ' + i).join('\n')}\n\n` +
      `建议：请重试分析或精简简历内容后再分析\n\n` +
      `接收到的内容片段（前300字符）：\n${extracted.substring(0, 300)}...`
    )
  }
}

/**
 * 提取完整的 JSON 对象（处理嵌套括号）
 */
function extractCompleteJSON(str) {
  const firstBrace = str.indexOf('{')
  if (firstBrace === -1) {
    return null
  }

  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escapeNext = false
  let endPos = -1

  for (let i = firstBrace; i < str.length; i++) {
    const char = str[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
    } else if (char === '[') {
      bracketCount++
    } else if (char === ']') {
      bracketCount--
    }

    // 找到完整的对象
    if (braceCount === 0 && bracketCount === 0 && i > firstBrace) {
      endPos = i
      break
    }
  }

  if (endPos === -1) {
    // 没有找到完整的对象，尝试返回到最后一个 }
    const lastBrace = str.lastIndexOf('}')
    if (lastBrace > firstBrace) {
      return str.substring(firstBrace, lastBrace + 1)
    }
    return null
  }

  return str.substring(firstBrace, endPos + 1)
}

/**
 * 分析简历（流式）
 * @param {string} resumeText - 简历文本
 * @param {Object} callbacks - 回调函数
 * @param {string} jobRequirements - 岗位要求（可选）
 */
export async function analyzeResumeStream(resumeText, callbacks, jobRequirements = '') {
  const { onProgress, onComplete, onError } = callbacks

  // 如果启用了模拟模式，直接返回模拟数据
  if (MOCK_MODE) {
    const { mockAnalyzeResumeStream } = await import('./mock.js')
    await mockAnalyzeResumeStream(resumeText, { onProgress, onComplete, onError })
    return
  }

  // 文本预处理：根据文本长度自动选择最佳策略
  onProgress?.('\n📊 正在优化简历文本...\n', '')
  const { processResumeText } = await import('@/utils/textProcessor.js')
  const processed = processResumeText(resumeText, {
    maxLength: 4000,           // 模型最大token限制
    maxSegmentLength: 2000,     // 分段最大长度
    summaryMaxLength: 3000      // 摘要最大长度
  })

  const textToAnalyze = processed.processedText
  const strategy = processed.strategy
  const metadata = processed.metadata

  // 通知用户使用的处理策略
  let strategyText = ''
  if (strategy === 'direct') {
    strategyText = '✓ 文本长度适中，直接分析'
  } else if (strategy === 'summarize') {
    strategyText = `✓ 智能摘要模式\n  原始: ${metadata.originalLength} 字符\n  压缩后: ${metadata.processedLength} 字符\n  压缩比: ${metadata.compressionRatio}`
  } else if (strategy === 'segment') {
    strategyText = `✓ 分段处理模式\n  原始: ${metadata.originalLength} 字符\n  分段数: ${metadata.segmentCount} 段\n  关键词: ${metadata.keywords?.join(', ') || '无'}`
  }

  onProgress?.(strategyText + '\n\n', strategyText + '\n\n')

  // 构建提示词
  let jobRequirementSection = ''
  if (jobRequirements && jobRequirements.trim()) {
    jobRequirementSection = `

## 📌 目标岗位要求

${jobRequirements}

---

**分析要求**：
请根据以上岗位要求，重点分析候选人的以下方面：
1. 岗位匹配度：评估候选人是否符合该岗位的要求
2. 技能匹配：对比候选人技能与岗位要求的匹配程度
3. 经验相关性：评估候选人的工作经验是否适用于该岗位
4. 缺失技能：指出候选人还需要补充哪些技能或经验
5. 推荐建议：给出明确的录用建议
`
  }

  const prompt = `请分析以下简历并以 Markdown 格式返回分析结果：

${textToAnalyze}${jobRequirementSection}

请按照以下结构返回分析结果（使用 Markdown 格式）：

\`\`\`markdown
# 简历分析报告

## 📋 个人信息
- **姓名**：[姓名]
- **联系方式**：[电话]
- **邮箱**：[邮箱]
- **所在地**：[城市]
- **年龄**：[年龄]
- **性别**：[性别]

## 🎓 教育背景
### [学校名称]
- **学历**：[学位]
- **专业**：[专业名称]
- **毕业年份**：[年份]
- **GPA**：[GPA]

## 💼 工作经验
### [公司名称]
- **职位**：[职位名称]
- **时间**：[时间段]
- **行业**：[行业]

**主要职责**：
- [职责1]
- [职责2]

**主要成就**：
- [成就1]
- [成就2]

**技术栈**：
- [技术1]
- [技术2]

## 🛠️ 技能清单
### 编程语言
- [语言1]
- [语言2]

### 游戏引擎
- [引擎1]
- [引擎2]

### 工具
- [工具1]
- [工具2]

### 专业领域
- [领域1]
- [领域2]

${jobRequirements ? `
## 📊 岗位匹配度分析
### 匹配度得分
- **总体匹配度**：[X]%
- **核心技能匹配**：[X]%
- **经验相关性**：[X]%

### 匹配分析
**已匹配的要求**：
- ✅ [要求1]：[候选人具备的能力]
- ✅ [要求2]：[候选人的相关经验]

**部分匹配的要求**：
- ⚠️ [要求1]：[部分符合的说明]
- ⚠️ [要求2]：[需要补充的内容]

**不匹配的要求**：
- ❌ [要求1]：[缺失的能力或经验]
- ❌ [要求2]：[与要求相反的经验]

### 技能对比
| 岗位要求 | 候选人技能 | 匹配度 |
|---------|----------|--------|
| [技能1] | [候选人的技能] | ✅/⚠️/❌ |
| [技能2] | [候选人的技能] | ✅/⚠️/❌ |

### 经验评估
**相关工作经验**：
- [相关工作经验1]
- [相关工作经验2]

**技能差距分析**：
- **已掌握**：[技能列表]
- **需要提升**：[技能列表]
- **建议学习路径**：[学习建议]

### 综合评价
- **优势**：[相对于岗位的优势]
- **劣势**：[相对于岗位的劣势]
- **推荐指数**：[强烈推荐/推荐/可以考虑/不推荐]
` : ''}

## 📈 工作经验分析
- **游戏行业经验**：[X] 年
- **相关公司数量**：[X] 家
- **总项目数**：[X] 个
- **游戏项目数**：[X] 个
- **管理经验**：[是/否]
- **团队规模**：[规模]
- **职业发展轨迹**：[描述]

**关键成就**：
- [成就1]
- [成就2]

## 🎓 教育评估
- **学位水平**：[本科/硕士/博士]
- **专业相关性**：[高/中/低]
- **学校水平**：[985/211/普通/其他]
- **评分**：[X]/100
- **评估分析**：[详细分析]

## 🚀 发展潜力
- **潜力评分**：[X]/100

**优势**：
- **[领域]**：[描述]
- **[领域]**：[描述]

**待提升**：
- **[领域]**：[描述]（建议：[改进建议]）
- **[领域]**：[描述]（建议：[改进建议]）

**发展潜力**：[描述]

**适合岗位**：
- [岗位1]
- [岗位2]

**综合分析**：[总结]

## 💡 建议
${jobRequirements ? `
**针对岗位要求**：
1. [建议1 - 基于岗位匹配情况]
2. [建议2 - 需要补充的技能]
3. [建议3 - 面试重点考察方向]

**职业发展建议**：
` : ''}
1. [建议1]
2. [建议2]
3. [建议3]

## ✅ 总结
### 总体评价
[总体评价文本]

### 核心亮点
- [亮点1]
- [亮点2]
- [亮点3]

### 潜在风险
- [风险1]
- [风险2]

${jobRequirements ? `
### 录用建议
- **推荐结果**：[强烈推荐/推荐/可以考虑/不推荐]
- **推荐理由**：[基于岗位匹配情况的具体理由]
- **建议薪资**：[薪资范围]
- **入职建议**：[是否建议录用及注意事项]
` : `
### 录用建议
- **推荐结果**：[强烈推荐/推荐/可以考虑/不推荐]
- **建议薪资**：[薪资范围]
`}
\`\`\`

请严格按照以上格式返回，使用 Markdown 语法。${jobRequirements ? '特别注意：请根据岗位要求进行有针对性的分析，重点评估候选人与岗位的匹配程度。' : ''}`

  const messages = [
    {
      role: 'user',
      content: prompt
    }
  ]

  await callZhipuAPIStream(messages, {
    onProgress: (chunk, fullContent) => {
      onProgress?.(chunk, fullContent)
    },
    onComplete: (fullContent) => {
      // 不再解析 JSON，直接返回 Markdown
      // 移除可能的 ```markdown 标记
      const cleaned = fullContent
        .replace(/```markdown\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      onComplete?.({
        format: 'markdown',
        content: cleaned,
        rawContent: fullContent
      })
    },
    onError: async (error) => {
      // 如果是429错误，自动切换到模拟模式
      if (error.message.includes('429') || error.message.includes('请求过于频繁')) {
        console.warn('⚠️ API 配额已耗尽，自动切换到模拟模式...')
        const { mockAnalyzeResumeStream } = await import('./mock.js')
        await mockAnalyzeResumeStream(resumeText, { onProgress, onComplete, onError })
      } else {
        onError?.(error)
      }
    }
  })
}

export default {
  callZhipuAPI,
  callZhipuAPIStream,
  analyzeResumeStream
}
