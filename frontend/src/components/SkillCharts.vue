<template>
  <div class="skill-charts">
    <a-row :gutter="[20, 20]">
      <a-col :xs="24" :lg="12">
        <div class="chart-container">
          <h3>技能类型统计</h3>
          <a-row :gutter="16" class="stats-row">
            <a-col :span="6">
              <a-card>
                <a-statistic
                  :value="programmingSkills.length"
                  :value-style="{ color: '#1890ff' }"
                >
                  <template #title>
                    <span class="stat-title">编程语言</span>
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic
                  :value="gameEngines.length"
                  :value-style="{ color: '#52c41a' }"
                >
                  <template #title>
                    <span class="stat-title">游戏引擎</span>
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic
                  :value="tools.length"
                  :value-style="{ color: '#faad14' }"
                >
                  <template #title>
                    <span class="stat-title">开发工具</span>
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card>
                <a-statistic
                  :value="otherSkills.length"
                  :value-style="{ color: '#722ed1' }"
                >
                  <template #title>
                    <span class="stat-title">其他技能</span>
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-col>

      <a-col :xs="24" :lg="12">
        <div class="chart-container">
          <h3>技能匹配对比</h3>
          <div v-if="hasSkillMatching">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-card>
                  <a-statistic
                    title="已匹配技能"
                    :value="matchedCount"
                    :value-style="{ color: '#52c41a' }"
                  >
                    <template #prefix>
                      <CheckCircleOutlined />
                    </template>
                  </a-statistic>
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card>
                  <a-statistic
                    title="缺失技能"
                    :value="missingCount"
                    :value-style="{ color: '#f5222d' }"
                  >
                    <template #prefix>
                      <CloseCircleOutlined />
                    </template>
                  </a-statistic>
                </a-card>
              </a-col>
            </a-row>
          </div>
          <a-empty v-else description="暂无匹配数据" />
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="[20, 20]" style="margin-top: 20px;">
      <a-col :xs="24" :md="8">
        <div class="chart-container">
          <h3>编程语言</h3>
          <div class="skill-tags">
            <a-space :size="[8, 8]" wrap>
              <a-tag
                v-for="(skill, index) in programmingSkills"
                :key="index"
                color="blue"
                style="font-size: 14px; padding: 5px 12px;"
              >
                {{ skill }}
              </a-tag>
            </a-space>
            <a-empty v-if="programmingSkills.length === 0" description="暂无数据" :image="false" />
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :md="8">
        <div class="chart-container">
          <h3>游戏引擎</h3>
          <div class="skill-tags">
            <a-space :size="[8, 8]" wrap>
              <a-tag
                v-for="(skill, index) in gameEngines"
                :key="index"
                color="green"
                style="font-size: 14px; padding: 5px 12px;"
              >
                {{ skill }}
              </a-tag>
            </a-space>
            <a-empty v-if="gameEngines.length === 0" description="暂无数据" :image="false" />
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :md="8">
        <div class="chart-container">
          <h3>工具和其他</h3>
          <div class="skill-tags">
            <a-space :size="[8, 8]" wrap>
              <a-tag
                v-for="(skill, index) in [...tools, ...otherSkills]"
                :key="index"
                color="purple"
                style="font-size: 14px; padding: 5px 12px;"
              >
                {{ skill }}
              </a-tag>
            </a-space>
            <a-empty v-if="tools.length === 0 && otherSkills.length === 0" description="暂无数据" :image="false" />
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  analysis: {
    type: Object,
    required: true
  }
})

const skills = computed(() => props.analysis?.skills || {})

const programmingSkills = computed(() => skills.value.programming_languages || [])
const gameEngines = computed(() => skills.value.game_engines || [])
const tools = computed(() => skills.value.tools || [])
const otherSkills = computed(() => skills.value.other_skills || [])

const hasSkills = computed(() => {
  return programmingSkills.value.length > 0 ||
         gameEngines.value.length > 0 ||
         tools.value.length > 0 ||
         otherSkills.value.length > 0
})

const hasSkillMatching = computed(() => {
  return props.analysis?.skill_matching?.matched_skills?.length > 0 ||
         props.analysis?.skill_matching?.missing_skills?.length > 0
})

const matchedCount = computed(() => {
  return props.analysis?.skill_matching?.matched_skills?.length || 0
})

const missingCount = computed(() => {
  return props.analysis?.skill_matching?.missing_skills?.length || 0
})
</script>

<style scoped>
.skill-charts {
  padding: 20px;
}

.chart-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 200px;
}

.chart-container h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.stats-row {
  margin-top: 20px;
}

.stat-title {
  font-size: 14px;
  color: #666;
}

.skill-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}
</style>
