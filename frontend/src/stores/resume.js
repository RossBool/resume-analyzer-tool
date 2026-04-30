import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useResumeStore = defineStore('resume', () => {
  const uploadedFile = ref(null)
  const analysisResult = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const hasAnalysis = computed(() => analysisResult.value !== null)

  function setUploadedFile(file) {
    uploadedFile.value = file
  }

  function setAnalysisResult(result) {
    analysisResult.value = result
  }

  function setLoading(value) {
    loading.value = value
  }

  function setError(message) {
    error.value = message
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    uploadedFile.value = null
    analysisResult.value = null
    loading.value = false
    error.value = null
  }

  return {
    uploadedFile,
    analysisResult,
    loading,
    error,
    hasAnalysis,
    setUploadedFile,
    setAnalysisResult,
    setLoading,
    setError,
    clearError,
    reset
  }
})
