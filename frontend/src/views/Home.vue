<template>
  <div class="home">
    <a-card class="welcome-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <FileTextOutlined class="title-icon" />
          <span>欢迎使用简历分析工具</span>
        </div>
      </template>

      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :lg="8" v-for="feature in features" :key="feature.title">
          <a-card
            class="feature-card"
            :hoverable="true"
            @click="goToUpload"
          >
            <div class="feature-icon" :style="{ background: feature.color + '15' }">
              <component :is="feature.icon" :style="{ color: feature.color }" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </a-card>
        </a-col>
      </a-row>

      <div class="actions">
        <a-button type="primary" size="large" @click="goToUpload">
          <UploadOutlined />
          开始分析简历
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  FileTextOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  MessageOutlined,
  RiseOutlined,
  FileSearchOutlined,
  ToolOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const features = [
  {
    icon: FileSearchOutlined,
    title: '信息提取',
    description: '自动提取个人信息、教育背景、工作经验和技能特长',
    color: '#1890ff'
  },
  {
    icon: ThunderboltOutlined,
    title: '智能分析',
    description: '深度简历分析和评估，提供专业的人才评估报告',
    color: '#52c41a'
  },
  {
    icon: BarChartOutlined,
    title: '技能匹配',
    description: '对比职位要求，评估候选人技能匹配程度',
    color: '#faad14'
  },
  {
    icon: MessageOutlined,
    title: '问题生成',
    description: '自动生成针对性面试问题，提高面试效率',
    color: '#f5222d'
  },
  {
    icon: RiseOutlined,
    title: '数据可视化',
    description: '图表展示分析结果，直观了解候选人情况',
    color: '#722ed1'
  },
  {
    icon: ToolOutlined,
    title: '多格式支持',
    description: '支持 PDF、Word 等多种简历格式',
    color: '#13c2c2'
  }
]

function goToUpload() {
  router.push('/upload')
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 26px;
  font-weight: 600;
  color: #1a1a1a;
}

.title-icon {
  font-size: 36px;
  color: #1890ff;
}

.feature-card {
  text-align: center;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  height: 100%;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: #1890ff;
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.feature-icon :deep(.anticon) {
  font-size: 40px;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
}

.feature-card p {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
  min-height: 54px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.actions {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
}

.actions .ant-btn {
  font-size: 16px;
  height: 48px;
  padding: 0 48px;
  border-radius: 24px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.actions .ant-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
}

.actions .ant-btn:active {
  transform: translateY(0);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .card-title {
    font-size: 22px;
  }

  .title-icon {
    font-size: 32px;
  }

  .feature-card h3 {
    font-size: 16px;
  }

  .feature-card p {
    font-size: 13px;
  }

  .actions .ant-btn {
    width: 100%;
  }
}
</style>
