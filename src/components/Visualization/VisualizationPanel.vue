<template>
	<div class="visualization-panel">
		<div class="panel-header">
			<h2>实时可视化</h2>
		</div>

		<div class="visualization-content">
			<!-- 参数曲线图表 -->
			<div class="charts-section">
				<h3>参数曲线</h3>
				<div class="chart-container">
					<Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
					<div v-else class="no-data">暂无数据</div>
				</div>
			</div>

			<!-- 实时参数显示 -->
			<div class="parameters-section">
				<h3>实时参数</h3>
				<div class="parameters-grid">
					<div v-for="param in activeParameters" :key="param.name" class="parameter-item">
						<div class="param-name">{{ param.name }}</div>
						<div class="param-value">{{ param.value.toFixed(3) }}</div>
						<div class="param-bar">
							<div class="param-bar-fill" :style="{ width: `${param.value * 100}%` }"></div>
						</div>
					</div>
				</div>
			</div>
			<!-- 可视化圆圈 -->
			<div class="circle-section">
				<h3>压力可视化</h3>
				<div class="circle-container">
					<div class="pressure-circle" :style="{
						width: `${pressureCircleSize}px`,
						height: `${pressureCircleSize}px`,
						opacity: pressureOpacity,
					}"></div>
				</div>
			</div>

			<!-- 测试区域 -->
			<TestArea />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	type ChartOptions,
} from 'chart.js'
import { useVisualizationStore } from '@/stores/visualization'
import TestArea from '@/components/Common/TestArea.vue'

// 注册 Chart.js 组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const visualizationStore = useVisualizationStore()

// 图表配置
const chartOptions: ChartOptions<'line'> = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		x: {
			type: 'linear',
			position: 'bottom',
			min: 0,
			max: 100,
		},
		y: {
			min: 0,
			max: 1,
		},
	},
	plugins: {
		legend: {
			position: 'top',
		},
	},
	animation: {
		duration: 0, // 关闭动画以提高性能
	},
}

// 计算属性
const chartData = computed(() => {
	return visualizationStore.chartData
})

const activeParameters = computed(() => {
	return visualizationStore.activeParameters
})

const pressureCircleSize = computed(() => {
	const pressure = visualizationStore.pressure
	return Math.min(50 + pressure * 150, 200) // 50px 到 200px
})

const pressureOpacity = computed(() => {
	const pressure = visualizationStore.pressure
	return Math.min(0.3 + pressure * 0.7, 1) // 0.3 到 1.0
})

// 生命周期
onMounted(() => {
	visualizationStore.startDataCollection()
})

onUnmounted(() => {
	visualizationStore.stopDataCollection()
})
</script>

<style scoped>
.visualization-panel {
	padding: 20px;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.panel-header h2 {
	margin: 0 0 20px 0;
	color: #333;
}

.visualization-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
	overflow-y: auto;
}

.charts-section,
.parameters-section,
.circle-section {
	background: #f8f9fa;
	border-radius: 8px;
	padding: 15px;
}

.charts-section h3,
.parameters-section h3,
.circle-section h3 {
	margin: 0 0 15px 0;
	color: #555;
	font-size: 16px;
}

.chart-container {
	height: 300px;
	position: relative;
}

.no-data {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: #666;
	font-style: italic;
}

.parameters-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 15px;
}

.parameter-item {
	background: white;
	border-radius: 6px;
	padding: 12px;
	border: 1px solid #e9ecef;
}

.param-name {
	font-weight: 500;
	color: #333;
	margin-bottom: 5px;
}

.param-value {
	font-family: monospace;
	font-size: 18px;
	color: #007bff;
	margin-bottom: 8px;
}

.param-bar {
	height: 6px;
	background: #e9ecef;
	border-radius: 3px;
	overflow: hidden;
}

.param-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
	transition: width 0.1s ease;
}

.circle-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 250px;
	background: white;
	border-radius: 6px;
	border: 1px solid #e9ecef;
}

.pressure-circle {
	border-radius: 50%;
	background: radial-gradient(circle, rgba(0, 123, 255, 0.6), rgba(0, 123, 255, 0.2));
	transition: all 0.1s ease;
	border: 2px solid rgba(0, 123, 255, 0.8);
}
</style>
