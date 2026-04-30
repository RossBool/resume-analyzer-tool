# 简历分析工具 - 快速开始指南

## 🎉 项目已成功搭建！

您的游戏行业简历分析工具已经准备就绪。以下是详细的使用说明。

## 📋 服务状态

✅ **后端服务**：运行在 http://localhost:8787
✅ **前端服务**：运行在 http://localhost:3000
✅ **AI 服务**：已配置智谱AI GLM-4.7模型

## 🚀 如何使用

### 方式一：使用Web界面（推荐）

1. **打开浏览器访问**：
   ```
   http://localhost:3000
   ```

2. **上传简历**：
   - 点击"开始分析简历"按钮
   - 拖拽或点击上传PDF/Word格式的简历
   - 文件大小限制：10MB

3. **查看分析结果**：
   - 系统会自动解析简历内容
   - 使用AI进行智能分析
   - 展示个人信息、教育背景、工作经验等
   - 显示技能匹配度和发展潜力评分

4. **生成面试问题**：
   - 点击"生成问题"按钮
   - AI会根据简历内容自动生成面试问题
   - 包含问题目的和考察要点

### 方式二：API调用

#### 1. 健康检查
```bash
curl http://localhost:8787/api/health
```

#### 2. 上传简历
```bash
curl -X POST http://localhost:8787/api/resume/upload \
  -F "resume=@/path/to/resume.pdf"
```

#### 3. 分析简历
```bash
curl -X POST http://localhost:8787/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"file_path":"/uploads/resume_xxx.pdf"}'
```

#### 4. 生成面试问题
```bash
curl -X POST http://localhost:8787/api/resume/questions \
  -H "Content-Type: application/json" \
  -d '{"analysis":{...}}'
```

## 🛠️ 服务管理

### 启动服务

**后端服务**：
```bash
cd backend
php83 -S localhost:8787 -t public public/router.php
```

**前端服务**：
```bash
cd frontend
pnpm run dev
```

### 停止服务

在终端按 `Ctrl + C` 停止服务

或者使用命令：
```bash
# 查找进程
ps aux | grep "php83.*8787"
ps aux | grep "vite"

# 停止进程
kill <PID>
```

## 📊 功能特性

### 1. 信息提取
- ✅ 个人信息（姓名、联系方式、邮箱）
- ✅ 教育背景（学校、学位、专业、毕业时间）
- ✅ 工作经验（公司、职位、工作时长、职责）
- ✅ 技能特长（编程语言、游戏引擎、工具等）

### 2. 智能分析
- ✅ 技能匹配度评分
- ✅ 游戏行业经验分析
- ✅ 教育背景评估
- ✅ 潜力预测（优势和不足）
- ✅ 可视化图表展示

### 3. 面试辅助
- ✅ 自动生成针对性面试问题
- ✅ 提供提问目的说明
- ✅ 标注考察要点

## 🔧 配置说明

### AI API配置

编辑 `backend/.env` 文件：
```
AI_API_KEY=your_api_key_here
AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
AI_MODEL=glm-4-plus
```

### 上传限制配置

在 `backend/.env` 中修改：
```
UPLOAD_MAX_SIZE=10485760  # 字节（默认10MB）
ALLOWED_FILE_TYPES=pdf,doc,docx
```

## 📝 测试建议

1. **准备测试简历**：找一份游戏行业相关的PDF或Word简历
2. **测试上传**：验证文件上传功能
3. **查看解析**：检查信息提取是否准确
4. **评估分析**：查看AI分析结果的质量
5. **生成问题**：测试面试问题生成功能
6. **数据可视化**：查看图表展示是否正常

## 🐛 常见问题

### Q: 上传文件失败？
A: 检查文件大小是否超过10MB，格式是否为PDF/DOC/DOCX

### Q: AI分析失败？
A: 确认API Key已正确配置，网络连接正常

### Q: 前端无法连接后端？
A: 确认后端服务正在运行在8787端口

### Q: 图表不显示？
A: 检查浏览器控制台错误，确认Chart.js依赖已安装

## 📚 项目结构

```
rg-resume-analyzer.rossbool.com/
├── backend/                    # 后端 (PHP 8.3)
│   ├── app/
│   │   ├── Controller/        # 控制器
│   │   └── Service/           # 业务逻辑
│   ├── public/                # 公共目录
│   │   ├── uploads/           # 上传文件目录
│   │   └── router.php         # 路由器
│   ├── config/                # 配置文件
│   ├── .env                   # 环境变量
│   └── composer.json          # PHP依赖
│
└── frontend/                   # 前端 (Vue 3)
    ├── src/
    │   ├── components/        # 组件
    │   ├── views/            # 页面
    │   ├── stores/           # 状态管理
    │   └── api/              # API接口
    ├── package.json          # Node依赖
    └── vite.config.js        # Vite配置
```

## 🎯 下一步

1. **测试完整流程**：上传简历并查看分析结果
2. **自定义配置**：根据需要调整AI提示词和评分规则
3. **添加数据库**：保存历史分析记录（可选）
4. **部署上线**：参考 INSTALL.md 进行生产环境部署

## 📖 相关文档

- [CLAUDE.md](./CLAUDE.md) - 项目架构说明
- [INSTALL.md](./INSTALL.md) - 安装部署指南
- [README.md](./README.md) - 项目概述

## 💡 提示

- 首次使用建议先用测试简历验证功能
- AI分析结果的质量取决于简历的详细程度
- 可以根据实际需求调整AI提示词以获得更好的分析效果
- 面试问题生成功能可以帮助HR快速准备面试

---

**祝您使用愉快！** 🎮✨

如有问题，请检查日志：
- 后端日志：终端输出
- 前端日志：浏览器控制台
