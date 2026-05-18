<template>
  <div class="toolbar-wrapper" :class="{ 'toolbar-hidden': hideToolbar }">
    <div class="toolbar" v-if="!isManuallyHidden">
      <div class="controls-group left-group">
        <template v-if="!isEditorMode">
          <button v-if="settings.cameraEnabled" @click="isRecording ? stopRecording() : startRecording()" class="btn icon-btn record-btn" :class="{ 'is-recording': isRecording }" :title="isRecording ? 'Stop Recording' : 'Start Recording'">
            <Square v-if="isRecording" :size="16" fill="currentColor" />
            <Circle v-else :size="16" fill="currentColor" />
          </button>
          <button @click="togglePlay" class="primary-btn icon-btn" :title="isPlaying ? 'Pause' : 'Play'">
            <Pause v-if="isPlaying" :size="20" />
            <Play v-else :size="20" />
          </button>
          <button @click="reset" class="btn icon-btn" title="Reset">
            <RotateCcw :size="18" />
          </button>
        </template>
        <span class="mode-badge" v-else>Editor Mode</span>
      </div>

      <div class="controls-group center-group">
        <div class="slider-wrapper">
          <Gauge :size="16" class="slider-icon" />
          <input type="range" v-model.number="settings.speed" min="0.2" max="10" step="0.1" class="styled-slider" title="Speed" />
          <span class="slider-value">{{ settings.speed.toFixed(1) }}x</span>
        </div>
        
        <div class="slider-wrapper">
          <Type :size="16" class="slider-icon" />
          <input type="range" v-model.number="settings.fontSize" min="20" max="120" step="2" class="styled-slider" title="Font Size" />
          <span class="slider-value">{{ settings.fontSize }}px</span>
        </div>
        
        <div class="slider-wrapper">
          <AlignJustify :size="16" class="slider-icon" />
          <input type="range" v-model.number="settings.lineHeight" min="1.0" max="3.0" step="0.1" class="styled-slider" title="Line Height" />
          <span class="slider-value">{{ settings.lineHeight.toFixed(1) }}</span>
        </div>
      </div>

      <div class="controls-group right-group">
        <button @click="settings.cameraEnabled = !settings.cameraEnabled" class="btn icon-btn" :class="{ active: settings.cameraEnabled }" title="Toggle Camera">
          <Camera :size="18" />
        </button>
        <button @click="settings.mirrorMode = !settings.mirrorMode" class="btn icon-btn" :class="{ active: settings.mirrorMode }" title="Mirror Text">
          <FlipHorizontal :size="18" />
        </button>
        <button @click="toggleMode" class="btn icon-btn" :class="{ 'active-mode': !isEditorMode }" :title="isEditorMode ? 'Switch to Prompter' : 'Switch to Editor'">
          <MonitorPlay v-if="isEditorMode" :size="18" />
          <Edit3 v-else :size="18" />
        </button>
        <button @click="toggleFullscreen" class="btn icon-btn" title="Toggle Fullscreen">
          <Maximize :size="18" />
        </button>
        <button @click="showDebugConsole = !showDebugConsole" class="btn icon-btn debug-toggle-btn" :class="{ active: showDebugConsole }" title="Show Debug Logs">
          <Bug :size="18" />
        </button>
        <button v-if="!isEditorMode" @click="isManuallyHidden = true" class="btn icon-btn" title="Hide Controls">
          <EyeOff :size="18" />
        </button>
      </div>
    </div>
    
    <div class="toolbar compact-toolbar" v-else>
      <button @click="isManuallyHidden = false" class="btn icon-btn primary-btn" title="Show Controls">
        <Eye :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { Play, Pause, RotateCcw, Gauge, Type, AlignJustify, FlipHorizontal, Edit3, MonitorPlay, Maximize, Eye, EyeOff, Camera, Circle, Square, Bug } from 'lucide-vue-next'

const { settings } = inject('settings')
const isPlaying = inject('isPlaying')
const togglePlay = inject('togglePlay')
const reset = inject('reset')

const isRecording = inject('isRecording')
const startRecording = inject('startRecording')
const stopRecording = inject('stopRecording')

const isEditorMode = inject('isEditorMode')
const setIsEditorMode = inject('setIsEditorMode')

const hideToolbar = inject('hideToolbar')
const showDebugConsole = inject('showDebugConsole')

const isManuallyHidden = ref(false)

// Revert manual hide if user switches back to Editor mode
watch(isEditorMode, (val) => {
  if (val) isManuallyHidden.value = false
})


const toggleMode = () => {
  setIsEditorMode(!isEditorMode.value)
  if (!isEditorMode.value && isPlaying.value) {
    togglePlay() // pause when entering edit
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}
</script>

<style scoped>
.toolbar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  padding: env(safe-area-inset-top) 16px 16px 16px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}

.toolbar-hidden {
  transform: translateY(-100%);
  opacity: 0;
}

.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  background: rgba(20, 20, 22, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 10px 16px;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.compact-toolbar {
  max-width: max-content;
  margin-left: auto; /* Push to right */
  margin-right: 0;
  border-radius: 50px;
  padding: 8px;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.center-group {
  flex: 1;
  justify-content: center;
  gap: 24px;
}

.mode-badge {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #a1a1aa;
  text-transform: uppercase;
  padding: 0 8px;
  white-space: nowrap;
}

/* Sliders */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a1a1aa;
}

.slider-icon {
  color: #71717a;
}

.slider-value {
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  min-width: 32px;
  text-align: right;
}

.styled-slider {
  -webkit-appearance: none;
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  transition: transform 0.1s;
}

.styled-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Buttons */
.btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(1px);
}

.btn.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.btn.active-mode {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.record-btn {
  color: #ef4444;
}
.record-btn.is-recording {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  animation: pulse-record 2s infinite;
}
@keyframes pulse-record {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@media (max-width: 768px) {
  .toolbar-wrapper {
    padding: env(safe-area-inset-top) 8px 8px 8px;
  }
  .toolbar {
    padding: 8px 12px;
    gap: 12px;
    justify-content: center;
  }
  .center-group {
    flex: 1 1 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .left-group, .right-group {
    flex: 0 0 auto;
  }
  .styled-slider {
    width: 60px;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
  }
  .mode-badge {
    display: none;
  }
}
</style>
