<template>
	<div class="test-area">
		<h3>测试区域</h3>
		<p>在此区域内移动鼠标并点击以测试压感输入</p>
		<div class="test-surface" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp">
			<div class="test-info">
				<div>鼠标位置: ({{ mouseX.toFixed(2) }}, {{ mouseY.toFixed(2) }})</div>
				<div>是否按下: {{ isPressed ? '是' : '否' }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const mouseX = ref(0)
const mouseY = ref(0)
const isPressed = ref(false)

function handleMouseDown(event: MouseEvent) {
	isPressed.value = true
	updateMousePosition(event)
}

function handleMouseMove(event: MouseEvent) {
	updateMousePosition(event)
}

function handleMouseUp() {
	isPressed.value = false
}

function updateMousePosition(event: MouseEvent) {
	const rect = (event.target as HTMLElement).getBoundingClientRect()
	mouseX.value = (event.clientX - rect.left) / rect.width
	mouseY.value = (event.clientY - rect.top) / rect.height
}
</script>

<style scoped>
.test-area {
	margin: 20px 0;
	padding: 15px;
	border: 2px dashed #ccc;
	border-radius: 8px;
}

.test-surface {
	width: 100%;
	height: 200px;
	background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: crosshair;
	user-select: none;
	margin-top: 10px;
}

.test-info {
	background: rgba(255, 255, 255, 0.9);
	padding: 10px;
	border-radius: 4px;
	border: 1px solid #ddd;
	font-family: monospace;
	font-size: 12px;
}

.test-info div {
	margin: 2px 0;
}
</style>
