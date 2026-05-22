<template>
  <div 
    class="app-wrapper" 
    @mousemove="onMouseMove" 
    @touchstart="onMouseMove"
  >
    <Toolbar v-if="!showPrivacy && !showAbout" />
    <div class="main-content" :class="{ 'privacy-view': showPrivacy || showAbout }">
      <PrivacyPolicy v-if="showPrivacy" />
      <AboutPage v-else-if="showAbout" />
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

    <!-- Camera bottom control bar (resolution on left, record button in center) -->
    <!-- Camera bar: unified frosted-glass row -->
    <div
      v-if="settings.cameraEnabled && !isEditorMode"
      class="bottom-camera-bar"
    >
      <div class="camera-bar-inner">

        <!-- LEFT: resolution & FPS (or timer when recording) -->
        <div class="camera-bar-left">
          <!-- When NOT recording: resolution + fps pickers -->
          <template v-if="!isRecording">
            <div class="camera-controls-left-wrapper">
              <!-- Resolution dropdown -->
              <Transition name="fade-menu">
                <div v-if="showResolutionMenu" class="camera-menu resolution-menu">
                  <button
                    v-for="res in ['4k', '1080p', '720p']" :key="res"
                    @click.stop="selectResolution(res)"
                    class="menu-item" :class="{ active: currentResolution === res }"
                  >
                    <span class="menu-item-text">{{ res === '4k' ? '4K UHD' : (res === '720p' ? '720p SD' : '1080p HD') }}</span>
                    <svg v-if="currentResolution === res" class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                </div>
              </Transition>
              <!-- FPS dropdown -->
              <Transition name="fade-menu">
                <div v-if="showFPSMenu" class="camera-menu fps-menu">
                  <button
                    v-for="fps in [60, 30]" :key="fps"
                    @click.stop="selectFPS(fps)"
                    class="menu-item" :class="{ active: currentFPS === fps }"
                  >
                    <span class="menu-item-text">{{ fps }} FPS</span>
                    <svg v-if="currentFPS === fps" class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                </div>
              </Transition>
              <!-- Pill badges -->
              <div class="cam-badge-row">
                <button @click.stop="toggleResolutionMenu" class="cam-badge" :class="{ active: showResolutionMenu }">
                  {{ currentResolution === '4k' ? '4K' : (currentResolution === '720p' ? '720p' : 'HD') }}
                </button>
                <span class="cam-badge-sep"></span>
                <button @click.stop="toggleFPSMenu" class="cam-badge" :class="{ active: showFPSMenu }">
                  {{ currentFPS }} fps
                </button>
              </div>
            </div>
          </template>
          <!-- When recording: show live timer -->
          <div v-else class="recording-timer-pill">
            <span class="timer-dot"></span>
            <span class="timer-text">{{ formattedTime }}</span>
          </div>
        </div>

        <!-- CENTER: record button -->
        <div class="camera-bar-center">
          <button
            @click="isRecording ? stopRecording() : startRecording()"
            class="bottom-record-btn"
            :class="{ 'is-recording': isRecording }"
            :title="isRecording ? 'Stop Recording' : 'Start Recording'"
          >
            <span class="record-btn-inner"></span>
          </button>
        </div>

        <!-- RIGHT: spacer to balance layout -->
        <div class="camera-bar-right"></div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast.visible" class="toast-notification">
        <span class="toast-spinner" v-if="toast.loading"></span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue'
import Editor from './components/Editor.vue'
import Teleprompter from './components/Teleprompter.vue'
import Toolbar from './components/Toolbar.vue'
import PrivacyPolicy from './components/PrivacyPolicy.vue'
import AboutPage from './components/AboutPage.vue'
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
const currentResolution = camera.currentResolution
const currentFPS = camera.currentFPS
const setResolutionAndFrameRate = camera.setResolutionAndFrameRate
const startRecording = camera.startRecording

const showResolutionMenu = ref(false)
const showFPSMenu = ref(false)

const toggleResolutionMenu = () => {
  showResolutionMenu.value = !showResolutionMenu.value
  showFPSMenu.value = false
}

const toggleFPSMenu = () => {
  showFPSMenu.value = !showFPSMenu.value
  showResolutionMenu.value = false
}

const selectResolution = async (res) => {
  showResolutionMenu.value = false
  await setResolutionAndFrameRate(res, currentFPS.value)
}

const selectFPS = async (fps) => {
  showFPSMenu.value = false
  await setResolutionAndFrameRate(currentResolution.value, fps)
}

const closeAllMenus = () => {
  showResolutionMenu.value = false
  showFPSMenu.value = false
}

// Toast Notification State & Controls
const toast = ref({
  visible: false,
  message: '',
  loading: false
})

let toastTimeout = null
const showToastMsg = (message, duration = 3000, loading = false) => {
  if (toastTimeout) clearTimeout(toastTimeout)
  toast.value = {
    visible: true,
    message,
    loading
  }
  if (duration > 0) {
    toastTimeout = setTimeout(() => {
      toast.value.visible = false
    }, duration)
  }
}

// Refresh Camera (disabled and enabled again)
const refreshCamera = async () => {
  if (!settings.value.cameraEnabled) return

  showToastMsg('Refreshing camera...', 0, true)

  try {
    settings.value.cameraEnabled = false
    // Wait for the stop process to complete and give it some breathing room
    await new Promise(resolve => setTimeout(resolve, 1000))
    settings.value.cameraEnabled = true
    
    // Show success toast and auto-dismiss after a brief delay
    showToastMsg('Camera refreshed successfully!', 2500, false)
  } catch (e) {
    console.error('Failed to refresh camera:', e)
    showToastMsg('Failed to refresh camera', 3000, false)
  }
}

// Wrapped stopRecording to auto-refresh camera after stopping
const stopRecording = async () => {
  try {
    await camera.stopRecording()
    // Trigger camera refresh
    await refreshCamera()
  } catch (e) {
    console.error('stopRecording failed:', e)
    showToastMsg('Failed to stop recording', 3000, false)
  }
}

// Watch cameraEnabled setting to start/stop native camera
watch(() => settings.value.cameraEnabled, async (enabled) => {
  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.toggle('camera-active', enabled)
  }
  if (enabled) {
    isEditorMode.value = false // Transition to prompter mode automatically
    showToastMsg('Camera loading...', 0, true)
    try {
      await camera.startCamera()
      showToastMsg('Camera ready!', 2000, false)
    } catch (e) {
      console.error(e)
      showToastMsg('Failed to start camera', 3000, false)
    }
  } else {
    await camera.stopCamera()
    // Hide toast if it was loading
    if (toast.value.visible && toast.value.message === 'Camera loading...') {
      toast.value.visible = false
    }
  }
})

// Stop camera when unmounting
onUnmounted(() => {
  if (settings.value.cameraEnabled) {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.remove('camera-active')
    }
    camera.stopCamera()
  }
})

// Mode state
const isEditorMode = ref(true)
const showPrivacy = ref(false)
const showAbout = ref(false)

const checkRoute = () => {
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  showPrivacy.value = path === '/privacypolicy' || hash === '#/privacypolicy' || hash === '#/privacy'
  showAbout.value = path === '/about' || hash === '#/about'
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
provide('showAbout', showAbout)

provide('isPlaying', scroll.isPlaying)
provide('togglePlay', scroll.toggle)
provide('reset', scroll.reset)
provide('scrollY', scroll.scrollY)
provide('maxScroll', scroll.maxScroll)
provide('countdown', scroll.countdown)

// Provide camera state
provide('isRecording', camera.isRecording)
provide('startRecording', camera.startRecording)
provide('stopRecording', stopRecording)

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
  window.addEventListener('click', closeAllMenus)
  checkRoute()
  window.addEventListener('popstate', checkRoute)
  window.addEventListener('hashchange', checkRoute)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('click', closeAllMenus)
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
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(env(safe-area-inset-bottom) + 80px); /* Space for bottom toolbar pill */
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

/* ── Camera Bottom Bar ──────────────────────────────────────────── */
.bottom-camera-bar {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 108px);
  left: 0;
  width: 100%;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  justify-content: center;
  padding: 0 24px;
}

.camera-bar-inner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 480px;
  background: rgba(10, 10, 14, 0.72);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  padding: 10px 20px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  animation: fadeInCameraBar 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.camera-bar-left,
.camera-bar-right {
  flex: 1;
  display: flex;
  align-items: center;
}
.camera-bar-right { justify-content: flex-end; }

.camera-bar-center {
  display: flex;
  justify-content: center;
  padding: 0 16px;
}

/* Resolution + FPS badge row */
.camera-controls-left-wrapper {
  position: relative;
}

.cam-badge-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cam-badge {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.7);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.cam-badge:hover {
  background: rgba(255,255,255,0.14);
  color: #fff;
}
.cam-badge.active {
  background: rgba(59,130,246,0.2);
  border-color: rgba(59,130,246,0.4);
  color: #93c5fd;
}

.cam-badge-sep {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.12);
  flex-shrink: 0;
}

/* Record button */
.bottom-record-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: transparent;
  border: 3.5px solid rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  padding: 0;
  transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.bottom-record-btn:hover  { transform: scale(1.06); }
.bottom-record-btn:active { transform: scale(0.93); }

.record-btn-inner {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 0 14px rgba(239,68,68,0.55);
  transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bottom-record-btn.is-recording .record-btn-inner {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  box-shadow: 0 0 18px rgba(239,68,68,0.7);
}

@keyframes fadeInCameraBar {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}

/* Recording timer (left side, replaces badge row) */
.recording-timer-pill {
  display: flex;
  align-items: center;
  gap: 7px;
}

.timer-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(239,68,68,0.7);
  animation: blink 1s infinite step-end;
}

.timer-text {
  font-size: 0.88rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
  letter-spacing: 0.02em;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
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

.ios-camera-btn.menu-open {
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

/* Dropdown Menu Styles */
.camera-menu {
  position: absolute;
  bottom: 58px;
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  z-index: 10002;
  min-width: 140px;
}

.resolution-menu {
  left: 0;
}

.fps-menu {
  right: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  color: #a1a1aa;
  padding: 8px 12px;
  border-radius: 10px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  width: 100%;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.menu-item.active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.check-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

/* Vue Menu Transitions */
.fade-menu-enter-active,
.fade-menu-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-menu-enter-from,
.fade-menu-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}

/* Recording Timer (inline, right of record button) */
.camera-controls-right {
  pointer-events: auto;
}

.recording-timer-inline {
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
  animation: fadeInCameraBar 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 130px;
  justify-content: center;
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

/* Toast Notification Styles */
.toast-notification {
  position: fixed;
  /* sit above camera bar + toolbar pill */
  bottom: calc(env(safe-area-inset-bottom) + 210px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10020;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 15, 20, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 50px;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.toast-text {
  letter-spacing: 0.2px;
}

.toast-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: toast-spin 0.8s linear infinite;
}

@keyframes toast-spin {
  to { transform: rotate(360deg); }
}

/* Vue transition styles for toast */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
