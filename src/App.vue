<template>
  <div 
    class="app-wrapper" 
    @mousemove="onMouseMove" 
    @touchstart="onMouseMove"
  >
    <Toolbar />
    <div class="main-content">
      <Editor v-if="isEditorMode" />
      <Teleprompter v-else />
    </div>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue'
import Editor from './components/Editor.vue'
import Teleprompter from './components/Teleprompter.vue'
import Toolbar from './components/Toolbar.vue'
import { useSettings } from './composables/useSettings'
import { useScroll } from './composables/useScroll'
import { useCamera } from './composables/useCamera'

const { settings } = useSettings()
const scroll = useScroll(settings)
const camera = useCamera()

// Watch cameraEnabled setting to start/stop native camera
watch(() => settings.value.cameraEnabled, async (enabled) => {
  document.documentElement.classList.toggle('camera-active', enabled)
  if (enabled) {
    isEditorMode.value = false // Transition to prompter mode automatically
    await camera.startCamera()
  } else {
    await camera.stopCamera()
  }
})

// Stop camera when unmounting
onUnmounted(() => {
  if (settings.value.cameraEnabled) {
    document.documentElement.classList.remove('camera-active')
    camera.stopCamera()
  }
})

// Mode state
const isEditorMode = ref(true)

// Provide state to components
provide('settings', { settings })
provide('isEditorMode', isEditorMode)
provide('setIsEditorMode', (val) => isEditorMode.value = val)

provide('isPlaying', scroll.isPlaying)
provide('togglePlay', scroll.toggle)
provide('reset', scroll.reset)
provide('scrollY', scroll.scrollY)
provide('maxScroll', scroll.maxScroll)

// Provide camera state
provide('isRecording', camera.isRecording)
provide('startRecording', camera.startRecording)
provide('stopRecording', camera.stopRecording)

// Auto-hide toolbar logic
const hideToolbar = ref(false)
let hideTimeout = null

const resetHideTimer = () => {
  hideToolbar.value = false
  if (hideTimeout) clearTimeout(hideTimeout)
  
  if (!isEditorMode.value && scroll.isPlaying.value) {
    hideTimeout = setTimeout(() => {
      hideToolbar.value = true
    }, 2500)
  }
}

const onMouseMove = () => {
  resetHideTimer()
}

watch([scroll.isPlaying, isEditorMode], () => {
  resetHideTimer()
})
provide('hideToolbar', hideToolbar)

// Keyboard shortcuts
const onKeyDown = (e) => {
  // Don't trigger shortcuts if user is typing in textarea
  if (e.target.tagName.toLowerCase() === 'textarea') return

  switch(e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (!isEditorMode.value) scroll.toggle()
      break
    case 'arrowup':
      e.preventDefault()
      settings.value.speed = Math.max(0.2, settings.value.speed - 0.1)
      break
    case 'arrowdown':
      e.preventDefault()
      settings.value.speed = Math.min(10, settings.value.speed + 0.1)
      break
    case 'r':
      scroll.reset()
      break
    case 'f':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen()
      }
      break
    case 'm':
      settings.value.mirrorMode = !settings.value.mirrorMode
      break
    case '=':
    case '+':
      settings.value.fontSize = Math.min(120, settings.value.fontSize + 2)
      break
    case '-':
      settings.value.fontSize = Math.max(20, settings.value.fontSize - 2)
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>

<style scoped>
.app-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top) + 60px); /* Space for toolbar */
  height: 100%;
}
</style>
