<template>
  <div class="result-page" v-if="analysis">
    <!-- Markdown 格式显示 -->
    <div v-if="analysis.format === 'markdown'" class="markdown-result">
      <a-card class="result-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <FileTextOutlined style="color: #1890ff;" />
            <span>简历分析报告</span>
          </div>
        </template>

        <template #extra>
          <a-space>
            <a-button type="primary" @click="goBack">
              <RollbackOutlined />
              返回首页
            </a-button>
            <a-button @click="handleExport">
              <DownloadOutlined />
              导出报告
            </a-button>
          </a-space>
        </template>

        <MarkdownRenderer :content="analysis.content" />
      </a-card>
    </div>

    <!-- 旧的 JSON 格式显示（保持兼容） -->
    <div v-else>
      <!-- 截断警告 -->
      <a-alert
        v-if="analysis._truncated"
        type="warning"
        show-icon
        closable
        style="margin-bottom: 20px;"
      >
        <template #message>
          <span><WarningOutlined /> 返回内容被截断</span>
        </template>
        <template #description>
          {{ analysis._warning }}
        </template>
      </a-alert>

      <!-- 顶部总评卡片 -->
      <a-card class="result-card summary-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <FileTextOutlined style="color: #1890ff;" />
            <span>分析总结</span>
          </div>
        </template>

      <a-row :gutter="[20, 20]">
        <!-- 总体评价 -->
        <a-col :xs="24" :lg="12">
          <div class="summary-section">
            <h4><StarOutlined style="color: #f5222d;" /> 总体评价</h4>
            <p class="summary-text" v-if="analysis.summary?.overall_evaluation">
              {{ analysis.summary.overall_evaluation }}
            </p>
            <a-empty v-else description="暂无总体评价" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
          </div>
        </a-col>

        <!-- 推荐结果 -->
        <a-col :xs="24" :lg="12">
          <div class="summary-section">
            <h4><CheckCircleOutlined style="color: #52c41a;" /> 推荐结果</h4>
            <div class="recommendation-result">
              <a-space direction="vertical" :size="12" style="width: 100%;">
                <div v-if="analysis.summary?.hire_recommendation">
                  <a-tag
                    :color="getRecommendationColor(analysis.summary.hire_recommendation)"
                    style="font-size: 16px; padding: 8px 20px;"
                  >
                    {{ analysis.summary.hire_recommendation }}
                  </a-tag>
                </div>
                <div v-if="analysis.summary?.salary_range" style="margin-top: 8px;">
                  <span style="color: #666;">建议薪资：</span>
                  <strong style="color: #1890ff; font-size: 16px;">{{ analysis.summary.salary_range }}</strong>
                </div>
              </a-space>
            </div>
          </div>
        </a-col>

        <!-- 核心亮点 -->
        <a-col :xs="24" :lg="24" v-if="analysis.summary?.key_highlights?.length > 0">
          <div class="summary-section">
            <h4><TrophyOutlined style="color: #faad14;" /> 核心亮点</h4>
            <a-space :size="[12, 12]" wrap>
              <a-tag
                v-for="(highlight, index) in analysis.summary.key_highlights"
                :key="index"
                color="success"
                style="padding: 6px 14px; font-size: 14px;"
              >
                {{ highlight }}
              </a-tag>
            </a-space>
          </div>
        </a-col>

        <!-- 潜在风险 -->
        <a-col :xs="24" :lg="24" v-if="analysis.summary?.risk_factors?.length > 0">
          <div class="summary-section">
            <h4><WarningOutlined style="color: #faad14;" /> 潜在风险</h4>
            <a-space :size="[12, 12]" wrap>
              <a-tag
                v-for="(risk, index) in analysis.summary.risk_factors"
                :key="index"
                color="warning"
                style="padding: 6px 14px; font-size: 14px;"
              >
                {{ risk }}
              </a-tag>
            </a-space>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-row :gutter="[20, 20]">
      <!-- 左侧主要信息 -->
      <a-col :xs="24" :lg="16">
        <!-- 个人信息卡片 -->
        <a-card title="个人信息" :bordered="false" class="result-card">
          <template #extra>
            <UserOutlined style="color: #1890ff;" />
          </template>
          <a-descriptions :column="responsiveColumn" bordered size="small">
            <a-descriptions-item label="姓名">
              {{ analysis.personal_info?.name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="联系方式">
              {{ analysis.personal_info?.contact || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="邮箱" :span="2">
              {{ analysis.personal_info?.email || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="所在地">
              {{ analysis.personal_info?.location || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="年龄">
              {{ analysis.personal_info?.age || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 教育背景 -->
        <a-card title="教育背景" :bordered="false" class="result-card">
          <template #extra>
            <BookOutlined style="color: #52c41a;" />
          </template>
          <a-timeline v-if="analysis.education && analysis.education.length > 0">
            <a-timeline-item v-for="(edu, index) in analysis.education" :key="index">
              <div class="timeline-item-content">
                <div class="timeline-header">
                  <strong>{{ edu.school }}</strong>
                  <a-tag color="blue">{{ edu.degree }}</a-tag>
                </div>
                <div class="timeline-body">
                  <p v-if="edu.major" style="margin: 4px 0;">{{ edu.major }}</p>
                  <a-tag v-if="edu.graduation_year" color="green">{{ edu.graduation_year }}年毕业</a-tag>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无教育信息" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </a-card>

        <!-- 工作经验 -->
        <a-card title="工作经验" :bordered="false" class="result-card">
          <template #extra>
            <AuditOutlined style="color: #faad14;" />
          </template>
          <a-timeline v-if="analysis.work_experience && analysis.work_experience.length > 0">
            <a-timeline-item v-for="(work, index) in analysis.work_experience" :key="index">
              <a-card size="small" class="work-card">
                <template #title>
                  <div class="work-header">
                    <strong>{{ work.company }}</strong>
                    <a-tag color="green">{{ work.duration }}</a-tag>
                  </div>
                </template>

                <div class="work-body">
                  <p><strong>职位：</strong>{{ work.position }}</p>

                  <div v-if="work.responsibilities && work.responsibilities.length > 0" style="margin-top: 12px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">主要职责：</p>
                    <a-ul style="margin: 0;">
                      <li v-for="(resp, i) in work.responsibilities" :key="i">{{ resp }}</li>
                    </a-ul>
                  </div>

                  <div v-if="work.achievements && work.achievements.length > 0" style="margin-top: 12px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">主要成就：</p>
                    <a-ul style="margin: 0;">
                      <li v-for="(ach, i) in work.achievements" :key="i">{{ ach }}</li>
                    </a-ul>
                  </div>

                  <div v-if="work.tech_stack && work.tech_stack.length > 0" style="margin-top: 12px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">技术栈：</p>
                    <a-space :size="[6, 6]" wrap>
                      <a-tag v-for="(tech, i) in work.tech_stack" :key="i" color="processing">{{ tech }}</a-tag>
                    </a-space>
                  </div>
                </div>
              </a-card>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无工作经验" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </a-card>
      </a-col>

      <!-- 右侧评分和建议 -->
      <a-col :xs="24" :lg="8">
        <!-- 综合评分 -->
        <a-card title="综合评分" :bordered="false" class="result-card">
          <template #extra>
            <StarOutlined style="color: #f5222d;" />
          </template>
          <div class="score-display">
            <a-progress
              type="circle"
              :percent="overallScore"
              :stroke-color="scoreColor"
              :width="140"
              :stroke-width="10"
            />
            <div style="text-align: center; margin-top: 16px;">
              <span style="font-size: 24px; font-weight: bold;" :style="{ color: scoreColor }">
                {{ overallScore }}分
              </span>
            </div>
          </div>
        </a-card>

        <!-- 技能匹配度 -->
        <a-card title="技能匹配度" :bordered="false" class="result-card">
          <template #extra>
            <TrophyOutlined style="color: #faad14;" />
          </template>
          <div class="skill-matching">
            <a-statistic
              title="匹配度得分"
              :value="analysis.skill_matching?.score || 0"
              suffix="%"
              :value-style="{ color: '#1890ff', fontSize: '32px', fontWeight: 'bold' }"
            />

            <a-divider style="margin: 16px 0;" />

            <!-- 已匹配技能 -->
            <div v-if="analysis.skill_matching?.matched_skills?.length > 0" style="margin-bottom: 16px;">
              <h4 style="font-size: 14px; margin-bottom: 12px;">已匹配技能</h4>
              <a-space :size="[8, 8]" wrap>
                <a-tag
                  v-for="(item, index) in analysis.skill_matching.matched_skills"
                  :key="index"
                  :color="getRelevanceColor(item.relevance)"
                  style="padding: 4px 12px;"
                >
                  {{ typeof item === 'string' ? item : item.skill }}
                  <span v-if="typeof item === 'object' && item.relevance" style="opacity: 0.7; margin-left: 4px; font-size: 12px;">
                    ({{ item.relevance }})
                  </span>
                </a-tag>
              </a-space>
            </div>

            <!-- 匹配分析 -->
            <div v-if="analysis.skill_matching?.analysis" style="background: #f5f5f5; padding: 12px; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666;">
                {{ analysis.skill_matching.analysis }}
              </p>
            </div>
          </div>
        </a-card>

        <!-- 发展潜力 -->
        <a-card title="发展潜力" :bordered="false" class="result-card">
          <template #extra>
            <RiseOutlined style="color: #722ed1;" />
          </template>
          <div class="potential">
            <a-progress
              :percent="analysis.potential_prediction?.score || 0"
              :stroke-color="potentialColor"
              stroke-linecap="square"
              :stroke-width="12"
              style="margin-bottom: 20px;"
            />

            <!-- 优势 -->
            <div v-if="analysis.potential_prediction?.strengths?.length > 0" style="margin-bottom: 16px;">
              <h4 style="font-size: 14px; margin-bottom: 12px;">
                <CheckCircleOutlined style="color: #52c41a;" /> 优势
              </h4>
              <div class="strength-weakness-list">
                <div v-for="(item, index) in analysis.potential_prediction.strengths" :key="index" class="sw-item">
                  <strong>{{ item.area }}：</strong>
                  <span>{{ item.description }}</span>
                </div>
              </div>
            </div>

            <!-- 待提升 -->
            <div v-if="analysis.potential_prediction?.weaknesses?.length > 0">
              <h4 style="font-size: 14px; margin-bottom: 12px;">
                <WarningOutlined style="color: #faad14;" /> 待提升
              </h4>
              <div class="strength-weakness-list">
                <div v-for="(item, index) in analysis.potential_prediction.weaknesses" :key="index" class="sw-item">
                  <div>
                    <strong>{{ item.area }}：</strong>
                    {{ item.description }}
                  </div>
                  <div v-if="item.improvement" style="margin-top: 6px; padding: 8px; background: #fff7e6; border-radius: 4px; font-size: 12px;">
                    💡 建议：{{ item.improvement }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 建议和操作 -->
    <a-row :gutter="[20, 20]">
      <!-- 建议卡片 -->
      <a-col :xs="24" :lg="12">
        <a-card title="建议" :bordered="false" class="result-card">
          <template #extra>
            <BulbOutlined style="color: #faad14;" />
          </template>
          <ul v-if="analysis.recommendations && analysis.recommendations.length > 0 && analysis.recommendations[0]" class="recommendation-list">
            <li v-for="(rec, index) in analysis.recommendations" :key="index">
              {{ rec }}
            </li>
          </ul>
          <a-empty v-else description="暂无建议" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </a-card>
      </a-col>

      <!-- 操作按钮 -->
      <a-col :xs="24" :lg="12">
        <a-card title="操作" :bordered="false" class="result-card">
          <div class="action-buttons">
            <a-space direction="vertical" :size="12" style="width: 100%;">
              <a-button type="primary" size="large" @click="goBack" block>
                <RollbackOutlined />
                返回首页，继续分析
              </a-button>
              <a-button size="large" @click="handleExport" block>
                <DownloadOutlined />
                导出分析报告
              </a-button>
            </a-space>
          </div>
        </a-card>
      </a-col>
    </a-row>
    </div>
  </div>

  <a-empty v-else description="暂无分析结果">
    <template #extra>
      <a-button type="primary" @click="goBack">返回首页</a-button>
    </template>
  </a-empty>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import { message } from 'ant-design-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import html2pdf from 'html2pdf.js'
import { marked } from 'marked'
import {
  UserOutlined,
  BookOutlined,
  AuditOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  PieChartOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RollbackOutlined,
  DownloadOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const resumeStore = useResumeStore()

const analysis = computed(() => resumeStore.analysisResult)

// 响应式列配置
const responsiveColumn = computed(() => {
  return window.innerWidth < 768 ? 1 : 2
})

const overallScore = computed(() => {
  if (!analysis.value) return 0
  const skillScore = analysis.value.skill_matching?.score || 0
  const eduScore = analysis.value.education_assessment?.score || 0
  const potentialScore = analysis.value.potential_prediction?.score || 0
  return Math.round((skillScore + eduScore + potentialScore) / 3)
})

const scoreColor = computed(() => {
  const score = overallScore.value
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#f5222d'
})

const potentialColor = computed(() => {
  const score = analysis.value?.potential_prediction?.score || 0
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#f5222d'
})

// 获取推荐结果的颜色
function getRecommendationColor(recommendation) {
  if (!recommendation) return 'default'

  const rec = recommendation.toLowerCase()
  if (rec.includes('强烈推荐')) return 'success'
  if (rec.includes('推荐')) return 'processing'
  if (rec.includes('可以考虑')) return 'warning'
  if (rec.includes('不推荐')) return 'error'
  return 'default'
}

function goBack() {
  router.push('/')
}

async function handleExport() {
  // 显示加载提示
  const loadingKey = 'export'
  message.loading({ content: '正在生成 PDF 报告...', key: loadingKey, duration: 0 })

  try {
    // 直接从 store 获取 Markdown 内容
    const markdownContent = analysis.value?.content

    if (!markdownContent) {
      message.error({ content: '没有可导出的内容', key: loadingKey, duration: 3 })
      return
    }

    console.log('Markdown 内容长度:', markdownContent.length)

    // 将 Markdown 转换为 HTML
    const htmlContent = marked.parse(markdownContent)

    console.log('转换后的 HTML 长度:', htmlContent.length)

    // 创建 PDF 容器
    const container = document.createElement('div')
    container.innerHTML = `
      <div style="padding: 40px; background: white;">
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e8e8e8;">
          <h1 style="font-size: 28px; font-weight: 700; color: #1890ff; margin: 0 0 8px 0;">简历分析报告</h1>
          <p style="color: #999; font-size: 14px; margin: 0;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
        <div class="content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333;">
          ${htmlContent}
        </div>
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e8e8e8; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 4px 0;">本报告由系统自动生成，仅供参考</p>
          <p style="margin: 4px 0;">简历分析工具 - RossBool</p>
        </div>
      </div>
    `

    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm'
    container.style.background = 'white'
    document.body.appendChild(container)

    console.log('容器已创建，高度:', container.offsetHeight)

    // 等待 DOM 渲染
    await new Promise(resolve => setTimeout(resolve, 500))

    // 配置 html2pdf
    const opt = {
      margin: 10,
      filename: `简历分析报告_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    }

    console.log('开始生成 PDF...')

    // 生成并下载 PDF
    await html2pdf().set(opt).from(container).save()

    console.log('PDF 生成成功！')

    message.success({ content: 'PDF 导出成功！', key: loadingKey, duration: 2 })

    // 清理临时容器
    document.body.removeChild(container)
  } catch (error) {
    console.error('导出错误:', error)
    message.error({ content: 'PDF 导出失败：' + error.message, key: loadingKey, duration: 3 })

    // 清理临时容器
    const tempContainer = document.querySelector('[style*="-9999px"]')
    if (tempContainer) {
      document.body.removeChild(tempContainer)
    }
  }
}

onMounted(() => {
  if (!analysis.value) {
    message.warning('未找到分析结果，请重新上传简历')
    router.push('/upload')
  }
})
</script>

<style scoped>
.result-page {
  max-width: 1400px;
  margin: 0 auto;
}

.result-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.summary-card {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 2px solid rgba(24, 144, 255, 0.2);
}

.summary-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
  margin: 0;
  padding: 12px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #1890ff;
}

.highlight-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlight-list li {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(82, 196, 26, 0.08);
  border-radius: 6px;
  border-left: 3px solid #52c41a;
  color: #555;
  line-height: 1.6;
}

.highlight-list li:last-child {
  margin-bottom: 0;
}

.risk-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.risk-list li {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(250, 173, 20, 0.08);
  border-radius: 6px;
  border-left: 3px solid #faad14;
  color: #666;
  line-height: 1.6;
}

.risk-list li:last-child {
  margin-bottom: 0;
}

.card-icon {
  font-size: 20px;
}

/* Markdown 结果样式 */
.markdown-result {
  max-width: 1200px;
  margin: 0 auto;
}

.markdown-result .result-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.markdown-result :deep(.markdown-renderer) {
  padding: 20px;
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
</style>
