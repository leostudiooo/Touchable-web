import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ParameterData {
  name: string
  value: number
  timestamp: number
}

export interface ChartDataPoint {
  x: number
  y: number
}

export interface ChartDataset {
  label: string
  data: ChartDataPoint[]
  borderColor: string
  backgroundColor: string
  tension: number
}

export const useVisualizationStore = defineStore('visualization', () => {
  // 状态
  const parameters = ref<Map<string, ParameterData>>(new Map())
  const dataHistory = ref<Map<string, ChartDataPoint[]>>(new Map())
  const maxDataPoints = ref(100)
  const isCollecting = ref(false)
  const startTime = ref(Date.now())

  // 当前压力值（用于圆圈显示）
  const pressure = ref(0)

  // 计算属性
  const activeParameters = computed(() => {
    return Array.from(parameters.value.values())
  })

  const chartData = computed(() => {
    const datasets: ChartDataset[] = []
    const colors = [
      { border: '#FF6384', background: 'rgba(255, 99, 132, 0.2)' },
      { border: '#36A2EB', background: 'rgba(54, 162, 235, 0.2)' },
      { border: '#FFCE56', background: 'rgba(255, 206, 86, 0.2)' },
      { border: '#4BC0C0', background: 'rgba(75, 192, 192, 0.2)' },
      { border: '#9966FF', background: 'rgba(153, 102, 255, 0.2)' },
      { border: '#FF9F40', background: 'rgba(255, 159, 64, 0.2)' },
    ]

    let colorIndex = 0
    dataHistory.value.forEach((data, paramName) => {
      if (data.length > 0) {
        const color = colors[colorIndex % colors.length]
        datasets.push({
          label: paramName,
          data: [...data],
          borderColor: color.border,
          backgroundColor: color.background,
          tension: 0.1,
        })
        colorIndex++
      }
    })

    return {
      datasets,
    }
  })

  // 动作
  function updateParameter(name: string, value: number) {
    const timestamp = Date.now()
    const relativeTime = (timestamp - startTime.value) / 1000 // 转换为秒

    // 更新参数值
    parameters.value.set(name, {
      name,
      value,
      timestamp,
    })

    // 更新历史数据
    let history = dataHistory.value.get(name)
    if (!history) {
      history = []
      dataHistory.value.set(name, history)
    }

    history.push({
      x: relativeTime,
      y: value,
    })

    // 限制数据点数量
    if (history.length > maxDataPoints.value) {
      history.shift()
    }

    // 更新压力值（如果是压力参数）
    if (name === '压力' || name === 'pressure') {
      pressure.value = value
    }
  }

  function clearParameter(name: string) {
    parameters.value.delete(name)
    dataHistory.value.delete(name)
  }

  function clearAllParameters() {
    parameters.value.clear()
    dataHistory.value.clear()
    pressure.value = 0
  }

  function setMaxDataPoints(max: number) {
    maxDataPoints.value = max

    // 修剪现有数据
    dataHistory.value.forEach((data) => {
      while (data.length > max) {
        data.shift()
      }
    })
  }
  function startDataCollection() {
    if (isCollecting.value) return

    isCollecting.value = true
    startTime.value = Date.now()

    console.log('Started data collection for visualization')
  }

  function stopDataCollection() {
    if (!isCollecting.value) return

    isCollecting.value = false
    console.log('Stopped data collection for visualization')
  }

  function resetVisualization() {
    clearAllParameters()
    startTime.value = Date.now()
  }

  return {
    // 状态
    parameters,
    dataHistory,
    maxDataPoints,
    isCollecting,
    pressure,

    // 计算属性
    activeParameters,
    chartData,

    // 动作
    updateParameter,
    clearParameter,
    clearAllParameters,
    setMaxDataPoints,
    startDataCollection,
    stopDataCollection,
    resetVisualization,
  }
})
