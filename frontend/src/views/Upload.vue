<template>
  <div class="upload-page">
    <a-card class="upload-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <CloudUploadOutlined class="title-icon" />
          <span>上传简历</span>
        </div>
      </template>

      <a-upload-dragger
        :before-upload="handleBeforeUpload"
        :file-list="fileList"
        @remove="handleRemove"
        accept=".pdf,.doc,.docx"
        :multiple="false"
        class="upload-dragger"
      >
        <p class="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持 PDF、DOC、DOCX 格式，文件大小不超过 10MB
        </p>
      </a-upload-dragger>

      <!-- 岗位要求输入 -->
      <a-divider>岗位要求（可选）</a-divider>
      <div class="job-requirements">
        <a-alert
          message="岗位要求已预填"
          description="已为您预填充 PHP 后端开发工程师的岗位要求。您可以根据实际需要修改岗位要求，系统将根据这些要求进行更精准的匹配分析。如需分析其他岗位，请清空后重新输入。"
          type="info"
          show-icon
          closable
          style="margin-bottom: 12px;"
        />
        <a-textarea
          v-model:value="jobRequirements"
          placeholder="已预填充默认岗位要求，可直接使用或修改..."
          :rows="12"
          :maxlength="5000"
          show-count
          :auto-size="{ minRows: 6, maxRows: 12 }"
        />
      </div>

      <a-descriptions
        v-if="selectedFile"
        title="文件信息"
        :column="2"
        bordered
        class="file-info"
      >
        <a-descriptions-item label="文件名">
          {{ selectedFile.name }}
        </a-descriptions-item>
        <a-descriptions-item label="文件大小">
          {{ formatFileSize(selectedFile.size) }}
        </a-descriptions-item>
        <a-descriptions-item label="文件类型">
          {{ selectedFile.type || '未知' }}
        </a-descriptions-item>
      </a-descriptions>

      <div class="actions">
        <a-space :size="16">
          <a-button
            type="primary"
            size="large"
            :loading="uploading"
            :disabled="!selectedFile"
            @click="handleUpload"
          >
            <UploadOutlined />
            {{ uploading ? '上传中...' : '开始上传并分析' }}
          </a-button>
          <a-button size="large" @click="handleReset" v-if="selectedFile">
            <ReloadOutlined />
            重新选择
          </a-button>
        </a-space>
      </div>

      <a-alert
        v-if="errorMessage"
        :message="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
        class="error-alert"
      />
    </a-card>

    <!-- 实时分析进度展示 -->
    <a-modal
      v-model:open="showAnalyzing"
      title="分析中..."
      :footer="null"
      :closable="false"
      width="800px"
      centered
    >
      <div class="analyzing-content">
        <a-progress
          :percent="analyzingProgress"
          :status="analyzingStatus"
          :stroke-color="{
            '0%': '#108ee9',
            '100%': '#87d068',
          }"
        />

        <div class="analyzing-info">
          <p><strong>状态：</strong>{{ analyzingMessage }}</p>
          <p v-if="analyzingContent.length > 0">
            <strong>已接收内容：</strong>{{ analyzingContent.length }} 字符
          </p>
        </div>

        <a-divider />

        <div class="analyzing-preview" v-if="analyzingContent">
          <h4>实时分析内容预览：</h4>
          <MarkdownRenderer :content="analyzingContent" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import { parseResumeFile } from '@/utils/fileParser'
import { message } from 'ant-design-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import {
  CloudUploadOutlined,
  UploadOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const resumeStore = useResumeStore()

const selectedFile = ref(null)
const fileList = ref([])
const uploading = ref(false)
const errorMessage = ref('')
const jobRequirements = ref(`#### 岗位职责：
1. 负责游戏数据系统的设计、开发与日常维护，保障数据流转的稳定与高效；
2. 参与现有游戏数据后台的重构与优化，提升系统性能、可扩展性及可维护性；
3. 编写清晰、规范的技术开发文档，支撑团队协作与知识沉淀。

#### 任职要求：
1. 扎实掌握PHP编程语言，熟练运用面向对象思想进行开发，熟悉Hyperf、EasySwoole等协程框架者优先；
2. 熟悉MySQL等常用数据库的设计、优化及操作，具备数据库性能调优经验；
3. 熟悉Swoole框架，有实际Swoole开发经验者优先；
4. 熟悉Golang、Python等一种或多种编程语言者优先；
5. 熟悉Kafka、RabbitMQ、HBase等技术栈者优先；
6. 熟悉Linux系统基本操作，有学习Golang的意愿和热情；
7. 具备强烈的责任心与主动学习意识，能独立分析并解决技术问题；拥有良好的沟通协调能力与团队合作精神，能适应一定的工作压力。`) // 岗位要求

// 实时分析状态
const showAnalyzing = ref(false)
const analyzingProgress = ref(0)
const analyzingStatus = ref('active')
const analyzingMessage = ref('')
const analyzingContent = ref('')

function handleBeforeUpload(file) {
  errorMessage.value = ''

  // 验证文件类型
  const fileExt = file.name.split('.').pop().toLowerCase()

  if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
    message.error('不支持的文件类型，仅支持 PDF、DOC、DOCX')
    return false
  }

  // 验证文件大小（10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    message.error('文件大小超过限制（最大10MB）')
    return false
  }

  selectedFile.value = file
  fileList.value = [file]

  return false // 阻止自动上传
}

function handleRemove() {
  selectedFile.value = null
  fileList.value = []
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function handleUpload() {
  if (!selectedFile.value) {
    errorMessage.value = '请先选择文件'
    return
  }

  uploading.value = true
  errorMessage.value = ''
  resumeStore.setError(null)

  // 重置分析状态
  analyzingProgress.value = 0
  analyzingStatus.value = 'active'
  analyzingMessage.value = '准备中...'
  analyzingContent.value = ''

  try {
    // 步骤1: 前端解析文件（不走后端）
    analyzingMessage.value = '正在解析文件...'
    message.loading({ content: '步骤 1/2: 正在解析文件...', key: 'upload', duration: 0 })

    const fileText = await parseResumeFile(selectedFile.value)

    if (!fileText || fileText.length < 50) {
      throw new Error('文件内容过少，可能是空文件或解析失败')
    }

    analyzingProgress.value = 30
    message.success({ content: '文件解析成功！', key: 'upload', duration: 1 })

    // 步骤2: 调用分析引擎（流式响应）
    analyzingMessage.value = '正在分析简历...'
    showAnalyzing.value = true

    const { analyzeResumeStream } = await import('@/api/zhipu')

    await analyzeResumeStream(
      fileText,
      {
        onProgress: (chunk, fullContent) => {
        // 实时更新分析内容（只在有内容时显示）
        if (fullContent && fullContent.length > 0) {
          analyzingContent.value = fullContent

          // 估算进度（基于接收内容长度）
          const estimatedProgress = Math.min(30 + Math.floor(fullContent.length / 50), 95)
          analyzingProgress.value = estimatedProgress
          analyzingMessage.value = `分析中... (已接收 ${fullContent.length} 字符)`
        }
      },
      onComplete: (analysis) => {
        analyzingProgress.value = 100
        analyzingStatus.value = 'success'
        analyzingMessage.value = '分析完成！'

        setTimeout(() => {
          showAnalyzing.value = false
          message.success({ content: '分析完成！', key: 'upload', duration: 2 })

          // 保存结果到 store
          resumeStore.setUploadedFile({
            file_name: selectedFile.value.name,
            file_size: selectedFile.value.size,
            job_requirements: jobRequirements.value
          })
          resumeStore.setAnalysisResult(analysis)

          // 跳转到结果页面
          setTimeout(() => {
            router.push('/result')
          }, 500)
        }, 1000)
      },
      onError: (error) => {
        analyzingStatus.value = 'exception'
        analyzingMessage.value = '分析失败'

        setTimeout(() => {
          showAnalyzing.value = false
          errorMessage.value = error.message || '分析失败，请重试'
          message.error({ content: errorMessage.value, key: 'upload', duration: 3 })
          resumeStore.setError(errorMessage.value)
          uploading.value = false
        }, 2000)
      }
    }, jobRequirements.value)

  } catch (error) {
    showAnalyzing.value = false
    errorMessage.value = error.message || '操作失败，请重试'
    message.error({ content: errorMessage.value, key: 'upload', duration: 3 })
    resumeStore.setError(errorMessage.value)
    uploading.value = false
  }
}

function handleReset() {
  selectedFile.value = null
  fileList.value = []
  errorMessage.value = ''
  resumeStore.reset()
}
</script>

<style scoped>
.upload-page {
  max-width: 800px;
  margin: 0 auto;
}

.upload-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.title-icon {
  font-size: 32px;
  color: #1890ff;
}

.upload-dragger {
  margin: 30px 0;
  background: #fafafa;
  border-radius: 8px;
}

.upload-dragger :deep(.ant-upload-drag-icon) {
  .anticon {
    font-size: 64px;
    color: #1890ff;
  }
}

.upload-dragger :deep(.ant-upload-text) {
  font-size: 16px;
  color: #333;
  margin-top: 16px;
}

.upload-dragger :deep(.ant-upload-hint) {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.file-info {
  margin-top: 30px;
  border-radius: 8px;
}

.actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
}

.actions .ant-btn {
  min-width: 160px;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
}

.error-alert {
  margin-top: 20px;
  border-radius: 8px;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .actions {
    display: flex;
    flex-direction: column;
  }

  .actions .ant-btn {
    width: 100%;
  }
}

/* 实时分析进度样式 */
.analyzing-content {
  padding: 10px 0;
}

.analyzing-info {
  margin-top: 20px;
  color: #666;
}

.analyzing-info p {
  margin: 8px 0;
}

.analyzing-preview {
  margin-top: 20px;
}

.analyzing-preview h4 {
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
}

.preview-content {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e8e8e8;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #333;
}
</style>
