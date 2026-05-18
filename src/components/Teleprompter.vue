<template>
  <div class="teleprompter-container" :class="{ 'camera-active': settings.cameraEnabled }">
    <div 
      class="scroll-area" 
      :style="{ transform: `translateY(-${scrollY}px)` }"
      ref="contentRef"
    >
      <div 
        class="script-content"
        :style="{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          transform: settings.mirrorMode ? 'scaleX(-1)' : 'none'
        }"
      >
        <p v-for="(paragraph, index) in paragraphs" :key="index">
          {{ paragraph }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted, onUpdated } from 'vue'

const { settings } = inject('settings')
const scrollY = inject('scrollY')
const maxScroll = inject('maxScroll')

const contentRef = ref(null)

const paragraphs = computed(() => {
  return settings.value.script.split('\n')
})

const updateMaxScroll = () => {
  if (contentRef.value) {
    // Height of content minus screen height (with some padding)
    const contentHeight = contentRef.value.scrollHeight
    const screenHeight = window.innerHeight
    maxScroll.value = Math.max(0, contentHeight - screenHeight + 200) // 200px padding at end
  }
}

onMounted(() => {
  updateMaxScroll()
  window.addEventListener('resize', updateMaxScroll)
})

onUpdated(() => {
  updateMaxScroll()
})
</script>

<style scoped>
.teleprompter-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden; /* We handle scrolling via transform */
  position: relative;
  background: black;
  display: flex;
  justify-content: center;
}

.teleprompter-container.camera-active {
  background: transparent;
}

.scroll-area {
  width: 100%;
  max-width: 900px;
  will-change: transform;
  padding: 50vh 20px; /* Start text from middle of screen */
}

.script-content {
  color: white;
  white-space: pre-wrap;
  text-align: left;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.6);
}

.script-content p {
  margin: 0 0 1em 0;
  min-height: 1em; /* For empty lines */
}
</style>
