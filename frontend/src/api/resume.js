import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000 // 增加到120秒，适应分析耗时
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 上传简历
 */
export function uploadResume(file) {
  const formData = new FormData()
  formData.append('resume', file)

  return api.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 上传60秒超时
  })
}

/**
 * 分析简历（分析可能需要较长时间）
 */
export function analyzeResume(filePath) {
  return api.post('/resume/analyze', {
    file_path: filePath
  }, {
    timeout: 180000 // 分析3分钟超时
  })
}

/**
 * 流式分析简历（SSE）
 * 返回 EventSource 对象
 */
export function analyzeResumeStream(filePath, callbacks) {
  const { onProgress, onComplete, onError } = callbacks

  // 使用fetch来支持POST请求的SSE
  fetch('/api/resume/analyze-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_path: filePath })
  }).then(response => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)

              if (parsed.event || parsed.message) {
                onProgress?.(parsed)
              }

              if (parsed.data) {
                onComplete?.(parsed.data)
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }

        read()
      })
    }

    read()
  }).catch(error => {
    onError?.(error)
  })
}

/**
 * 生成面试问题
 */
export function generateQuestions(analysis) {
  return api.post('/resume/questions', {
    analysis: analysis
  })
}

/**
 * 获取分析结果
 */
export function getResumeResult(id) {
  return api.get(`/resume/result/${id}`)
}

export default api
