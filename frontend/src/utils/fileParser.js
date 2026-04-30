/**
 * 前端文件解析工具
 * 支持解析 PDF、DOC、DOCX 文件
 */

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 配置 PDF.js worker（使用 ESM 导入）
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * 解析 PDF 文件
 * @param {File} file - PDF 文件对象
 * @returns {Promise<string>} - 解析后的文本
 */
export async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''

    // 遍历所有页面
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // 提取文本内容
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')

      fullText += pageText + '\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('PDF 解析错误:', error)
    throw new Error('PDF 文件解析失败')
  }
}

/**
 * 解析 DOCX 文件
 * @param {File} file - DOCX 文件对象
 * @returns {Promise<string>} - 解析后的文本
 */
export async function parseDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    return result.value.trim()
  } catch (error) {
    console.error('DOCX 解析错误:', error)
    throw new Error('DOCX 文件解析失败')
  }
}

/**
 * 解析 DOC 文件（使用 mammoth，部分支持）
 * @param {File} file - DOC 文件对象
 * @returns {Promise<string>} - 解析后的文本
 */
export async function parseDOC(file) {
  // mammoth 主要支持 DOCX，对旧版 DOC 支持有限
  // 尝试解析，如果失败则提示用户
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages.length > 0) {
      console.warn('DOC 解析警告:', result.messages)
    }

    return result.value.trim()
  } catch (error) {
    console.error('DOC 解析错误:', error)
    throw new Error('DOC 文件解析失败，建议转换为 DOCX 或 PDF 格式')
  }
}

/**
 * 解析简历文件
 * @param {File} file - 简历文件对象
 * @returns {Promise<string>} - 解析后的文本
 */
export async function parseResumeFile(file) {
  const fileName = file.name.toLowerCase()
  const fileExt = fileName.split('.').pop()

  switch (fileExt) {
    case 'pdf':
      return await parsePDF(file)
    case 'docx':
      return await parseDOCX(file)
    case 'doc':
      return await parseDOC(file)
    default:
      throw new Error('不支持的文件格式')
  }
}

export default {
  parsePDF,
  parseDOCX,
  parseDOC,
  parseResumeFile
}
