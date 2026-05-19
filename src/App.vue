<template>
  <div 
    class="app-wrapper" 
    @mousemove="onMouseMove" 
    @touchstart="onMouseMove"
  >
    <Toolbar v-if="!showPrivacy" />
    <div class="main-content" :class="{ 'privacy-view': showPrivacy }">
      <PrivacyPolicy v-if="showPrivacy" />
      <template v-else>
        <Editor v-if="isEditorMode" />
        <Teleprompter v-else />
      </template>
    </div>

    <!-- On-screen debugger panel for mobile Safari/PWA testing -->
    <div class="debug-panel" v-if="showDebugConsole">
      <div class="debug-header">
        <span>Console Logs</span>
        <div class="debug-actions">
          <button @click="clearLogs" class="debug-btn-small">Clear</button>
          <button @click="showDebugConsole = false" class="debug-btn-small close">Close</button>
        </div>
      </div>
      <div class="debug-body">
        <div v-for="(log, idx) in logs" :key="idx" class="debug-log-item" :class="log.type">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="no-logs">No logs recorded yet. Try turning on the camera to capture events.</div>
      </div>
    </div>

    <!-- Floating Stop Recording button at the bottom -->
    <button 
      v-if="isRecording" 
      @click="stopRecording" 
      class="floating-stop-btn"
    >
      <span class="stop-icon-dot"></span>
      <span>Stop Recording</span>
    </button>

    <!-- iOS style Camera controls at the bottom when camera is enabled but not recording -->
    <div 
      v-if="settings.cameraEnabled && !isEditorMode && !isRecording" 
      class="camera-controls-bottom"
    >
      <button @click="toggleResolution" class="ios-camera-btn">
        {{ currentResolution === '4k' ? '4K' : 'HD' }}
      </button>
      <span class="ios-camera-divider">|</span>
      <button @click="toggleFPS" class="ios-camera-btn">
        {{ currentFPS }}
      </button>
    </div>

    <!-- iOS style Recording Timer at the top center -->
    <div v-if="isRecording" class="recording-timer">
      <span class="timer-dot"></span>
      <span class="timer-text">{{ formattedTime }}</span>
    </div>

    <!-- Video Save Status Display for copying -->
    <div v-if="saveStatusLog" class="save-status-display">
      <div class="save-status-header">
        <span>Video Saving Log</span>
        <button @click="copySaveStatus" class="copy-btn">Copy</button>
      </div>
      <div class="save-status-content">{{ saveStatusLog }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue'
import Editor from './components/Editor.vue'
import Teleprompter from './components/Teleprompter.vue'
import Toolbar from './components/Toolbar.vue'
import PrivacyPolicy from './components/PrivacyPolicy.vue'
import { useSettings } from './composables/useSettings'
import { useScroll } from './composables/useScroll'
import { useCamera } from './composables/useCamera'
import { useDebug } from './composables/useDebug'
import { Capacitor } from '@capacitor/core'

const { settings } = useSettings()
const scroll = useScroll(settings)
const camera = useCamera()
const { logs, showDebugConsole, clearLogs } = useDebug()

const isRecording = camera.isRecording
const stopRecording = camera.stopRecording
const currentResolution = camera.currentResolution
const currentFPS = camera.currentFPS
const setResolutionAndFrameRate = camera.setResolutionAndFrameRate
const saveStatusLog = camera.saveStatusLog

const copySaveStatus = () => {
  if (saveStatusLog.value) {
    navigator.clipboard.writeText(saveStatusLog.value)
    alert('Log copied to clipboard!')
  }
}

// Watch cameraEnabled setting to start/stop native camera
watch(() => settings.value.cameraEnabled, async (enabled) => {
  if (Capacitor.isNative) {
    document.documentElement.classList.toggle('camera-active', enabled)
  }
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
    if (Capacitor.isNative) {
      document.documentElement.classList.remove('camera-active')
    }
    camera.stopCamera()
  }
})

// Mode state
const isEditorMode = ref(true)
const showPrivacy = ref(false)

const checkRoute = () => {
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  showPrivacy.value = path === '/privacypolicy' || hash === '#/privacypolicy' || hash === '#/privacy'
}

const navigateTo = (isPrivacy) => {
  const protocol = window.location.protocol
  const isWeb = protocol.startsWith('http')
  
  if (isPrivacy) {
    if (isWeb) {
      if (window.location.pathname.toLowerCase() !== '/privacypolicy') {
        history.pushState(null, '', '/PrivacyPolicy')
      }
    } else {
      if (window.location.hash.toLowerCase() !== '#/privacypolicy') {
        window.location.hash = '/PrivacyPolicy'
      }
    }
  } else {
    if (isWeb) {
      if (window.location.pathname.toLowerCase() === '/privacypolicy') {
        history.pushState(null, '', '/')
      }
    } else {
      if (window.location.hash.toLowerCase() === '#/privacypolicy') {
        window.location.hash = '/'
      }
    }
  }
}

watch(showPrivacy, (newVal) => {
  navigateTo(newVal)
})

// Provide state to components
provide('settings', { settings })
provide('isEditorMode', isEditorMode)
provide('setIsEditorMode', (val) => isEditorMode.value = val)
provide('showPrivacy', showPrivacy)

provide('isPlaying', scroll.isPlaying)
provide('togglePlay', scroll.toggle)
provide('reset', scroll.reset)
provide('scrollY', scroll.scrollY)
provide('maxScroll', scroll.maxScroll)

// Provide camera state
provide('isRecording', camera.isRecording)
provide('startRecording', camera.startRecording)
provide('stopRecording', camera.stopRecording)

// Provide debug state
provide('showDebugConsole', showDebugConsole)
provide('logs', logs)
provide('clearLogs', clearLogs)

// Auto-hide toolbar logic (disabled - manual control via hide button only)
const hideToolbar = ref(false)
const resetHideTimer = () => {}
const onMouseMove = () => {}
provide('hideToolbar', hideToolbar)

// Recording Timer State & Controls
const secondsRecorded = ref(0)
const timerInterval = ref(null)

const formattedTime = computed(() => {
  const mins = Math.floor(secondsRecorded.value / 60)
  const secs = secondsRecorded.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const startTimer = () => {
  secondsRecorded.value = 0
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    secondsRecorded.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

watch(isRecording, (recording) => {
  if (recording) {
    startTimer()
  } else {
    stopTimer()
  }
})

const toggleResolution = async () => {
  const newRes = currentResolution.value === '1080p' ? '4k' : '1080p'
  await setResolutionAndFrameRate(newRes, currentFPS.value)
}

const toggleFPS = async () => {
  const newFPS = currentFPS.value === 30 ? 60 : 30
  await setResolutionAndFrameRate(currentResolution.value, newFPS)
}

// Keyboard shortcuts
const onKeyDown = (e) => {
  // Don't trigger shortcuts if user is typing in textarea or viewing privacy policy
  if (e.target.tagName.toLowerCase() === 'textarea') return
  if (showPrivacy.value) return

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
  checkRoute()
  window.addEventListener('popstate', checkRoute)
  window.addEventListener('hashchange', checkRoute)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('popstate', checkRoute)
  window.removeEventListener('hashchange', checkRoute)
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

.main-content.privacy-view {
  padding-top: env(safe-area-inset-top);
}

/* On-Screen Debug Console Styles */
.debug-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 40vh;
  background: rgba(15, 15, 17, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  color: #a1a1aa;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(30, 30, 35, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
  font-weight: bold;
}

.debug-actions {
  display: flex;
  gap: 8px;
}

.debug-btn-small {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.debug-btn-small:hover {
  background: rgba(255, 255, 255, 0.2);
}

.debug-btn-small.close {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.debug-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debug-log-item {
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
  padding: 2px 0;
}

.debug-log-item.error {
  color: #f87171;
}

.debug-log-item.warn {
  color: #fbbf24;
}

.log-time {
  color: #71717a;
  margin-right: 8px;
}

.no-logs {
  color: #71717a;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* Floating Stop Recording Button Styles */
.floating-stop-btn {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(239, 68, 68, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(239, 68, 68, 0.5);
  padding: 12px 28px;
  border-radius: 50px;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.5px;
}

.floating-stop-btn:hover {
  background: rgba(239, 68, 68, 0.35);
  border-color: rgba(239, 68, 68, 0.7);
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.floating-stop-btn:active {
  transform: translateX(-50%) translateY(1px);
}

.stop-icon-dot {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  position: relative;
}

.stop-icon-dot::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #ef4444;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite ease-out;
}

@keyframes pulse-dot {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* iOS Style Camera Controls (Resolution / FPS) */
.camera-controls-bottom {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  padding: 8px 20px;
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.ios-camera-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  padding: 4px 10px;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.ios-camera-btn:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.ios-camera-btn:active {
  opacity: 0.5;
  transform: scale(0.95);
}

.ios-camera-divider {
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.85rem;
  font-weight: 300;
  user-select: none;
}

/* iOS Style Recording Timer */
.recording-timer {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 20px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 6px 16px;
  border-radius: 20px;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.timer-dot {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  animation: blink 1s infinite step-end;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -30px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

/* Video Save Status Panel */
.save-status-display {
  position: fixed;
  bottom: 80px;
  left: 20px;
  right: 20px;
  background: rgba(18, 18, 23, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  z-index: 10002;
  color: #fff;
  font-family: monospace;
  font-size: 0.8rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.save-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 6px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.6);
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 10px;
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.save-status-content {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 80px;
  overflow-y: auto;
  line-height: 1.4;
}
</style>
