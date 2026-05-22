<template>
  <div class="teleprompter-container" :class="{ 'camera-active': settings.cameraEnabled }">
    <Transition name="fade-countdown">
      <div v-if="countdown > 0" class="countdown-overlay">
        <Transition name="number-fade" mode="out-in">
          <div :key="countdown" class="countdown-number">{{ countdown }}</div>
        </Transition>
      </div>
    </Transition>
    <div 
      class="scroll-area" 
      :style="{ transform: `translateY(-${scrollY}px)` }"
      ref="contentRef"
      @wheel.prevent="onWheel"
      @touchstart="onTouchStart"
      @touchmove.prevent="onTouchMove"
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
const countdown = inject('countdown')

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

const onWheel = (e) => {
  scrollY.value = Math.max(0, Math.min(maxScroll.value, scrollY.value + e.deltaY))
}

let lastTouchY = 0
const onTouchStart = (e) => {
  if (e.touches.length > 0) {
    lastTouchY = e.touches[0].clientY
  }
}

const onTouchMove = (e) => {
  if (e.touches.length > 0) {
    const currentY = e.touches[0].clientY
    const deltaY = lastTouchY - currentY
    scrollY.value = Math.max(0, Math.min(maxScroll.value, scrollY.value + deltaY))
    lastTouchY = currentY
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
  z-index: 1;
}

.teleprompter-container.camera-active {
  background: transparent;
}

.scroll-area {
  width: 100%;
  max-width: 900px;
  will-change: transform;
  padding: 50vh 20px; /* Start text from middle of screen */
  z-index: 2;
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

/* Countdown Overlay */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.countdown-number {
  font-size: 15rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
}

.number-fade-enter-active,
.number-fade-leave-active {
  transition: opacity 0.15s ease;
}

.number-fade-enter-from,
.number-fade-leave-to {
  opacity: 0;
}

.fade-countdown-enter-active,
.fade-countdown-leave-active {
  transition: opacity 0.3s ease;
}

.fade-countdown-enter-from,
.fade-countdown-leave-to {
  opacity: 0;
}
</style>
