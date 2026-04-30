<template>
  <a-layout class="app-layout">
    <a-layout-header class="header">
      <div class="header-content">
        <h1 class="title">
          <span class="icon">🎮</span>
          简历分析工具
        </h1>
        <p class="subtitle">游戏行业专业简历分析系统</p>
      </div>
    </a-layout-header>

    <a-layout-content class="content">
      <router-view />
    </a-layout-content>

    <a-layout-footer class="footer">
      <p>&copy; 2024 RossBool. All rights reserved.</p>
    </a-layout-footer>
  </a-layout>
</template>

<script setup>
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 0 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-content {
  text-align: center;
}

.title {
  font-size: 28px;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon {
  font-size: 32px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0 0;
}

.content {
  padding: 40px 20px;
}

.footer {
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
