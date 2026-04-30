<template>
  <div class="markdown-renderer" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 配置 marked 使用 highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,  // 支持换行符
  gfm: true      // 支持 GitHub Flavored Markdown
})

const renderedMarkdown = computed(() => {
  if (!props.content) return ''

  try {
    return marked.parse(props.content)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return `<pre>${props.content}</pre>`
  }
})
</script>

<style scoped>
.markdown-renderer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.8;
  color: #333;
}

/* Markdown 样式 */
.markdown-renderer :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8e8e8;
}

.markdown-renderer :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 20px 0 12px 0;
  padding-left: 12px;
  border-left: 4px solid #1890ff;
}

.markdown-renderer :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 10px 0;
}

.markdown-renderer :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
}

.markdown-renderer :deep(ul) {
  padding-left: 24px;
  margin: 12px 0;
}

.markdown-renderer :deep(li) {
  margin: 8px 0;
  line-height: 1.8;
}

.markdown-renderer :deep(strong) {
  color: #1890ff;
  font-weight: 600;
}

.markdown-renderer :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #d63384;
}

.markdown-renderer :deep(pre) {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-renderer :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #24292e;
}

.markdown-renderer :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  margin: 16px 0;
  color: #6a737d;
  font-style: italic;
}

.markdown-renderer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-renderer :deep(table th) {
  background: #f6f8fa;
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  font-weight: 600;
  text-align: left;
}

.markdown-renderer :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}

.markdown-renderer :deep(hr) {
  border: none;
  border-top: 2px solid #e1e4e8;
  margin: 24px 0;
}

/* 代码高亮样式 */
.markdown-renderer :deep(.hljs) {
  background: #f6f8fa;
}
</style>
