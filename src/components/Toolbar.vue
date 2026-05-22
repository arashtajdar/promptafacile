<template>
  <Transition name="toolbar-slide">
    <div v-if="!hideToolbar" class="toolbar-root">

      <!-- ── Minimised orb ── -->
      <Transition name="orb-pop">
        <button
          v-if="isManuallyHidden"
          class="show-orb"
          @click="isManuallyHidden = false"
          title="Show Controls"
          id="show-controls-orb"
        >
          <Eye :size="18" />
        </button>
      </Transition>

      <!-- ── Vertical slider panel (floats above pill) ── -->
      <Transition name="panel-pop">
        <div v-if="panelOpen && !isManuallyHidden" class="slider-panel" id="slider-panel">
          <div class="panel-header">
            <span class="panel-title">Adjust</span>
            <button class="panel-close" @click="panelOpen = false"><X :size="14" /></button>
          </div>

          <!-- Speed -->
          <div class="panel-row">
            <div class="panel-row-label">
              <Gauge :size="14" class="panel-icon speed-icon" />
              <span>Speed</span>
            </div>
            <div class="panel-row-right">
              <input type="range" v-model.number="settings.speed"
                min="0.2" max="10" step="0.1" class="vtrack speed-track" id="slider-speed" />
              <span class="vval">{{ settings.speed.toFixed(1) }}<em>x</em></span>
            </div>
          </div>

          <!-- Font Size -->
          <div class="panel-row">
            <div class="panel-row-label">
              <Type :size="14" class="panel-icon font-icon" />
              <span>Size</span>
            </div>
            <div class="panel-row-right">
              <input type="range" v-model.number="settings.fontSize"
                min="20" max="120" step="2" class="vtrack font-track" id="slider-font" />
              <span class="vval">{{ settings.fontSize }}<em>px</em></span>
            </div>
          </div>

          <!-- Line Height -->
          <div class="panel-row">
            <div class="panel-row-label">
              <AlignJustify :size="14" class="panel-icon line-icon" />
              <span>Leading</span>
            </div>
            <div class="panel-row-right">
              <input type="range" v-model.number="settings.lineHeight"
                min="1.0" max="3.0" step="0.1" class="vtrack line-track" id="slider-line" />
              <span class="vval">{{ settings.lineHeight.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ── Main pill ── -->
      <Transition name="pill-expand">
        <div v-if="!isManuallyHidden" class="toolbar-pill" id="main-toolbar">

          <!-- LEFT: Playback -->
          <div class="pill-section">
            <template v-if="!isEditorMode">
              <!-- Prompter mode: play, reset, then green edit button -->
              <button id="btn-play-pause" @click="handleTogglePlay"
                class="pill-btn play-btn" :class="{ playing: isPlaying }"
                :title="isPlaying ? 'Pause' : 'Play'">
                <Pause v-if="isPlaying" :size="19" />
                <Play v-else :size="19" />
              </button>
              <button id="btn-reset" @click="handleReset"
                class="pill-btn reset-btn" title="Reset to top">
                <RotateCcw :size="16" />
              </button>
              <button id="btn-go-editor" @click="handleToggleMode"
                class="pill-btn edit-mode-btn" title="Switch to Editor">
                <Edit3 :size="16" />
              </button>
            </template>
            <!-- Editor mode: icon-only go-to-prompter button -->
            <button v-else
              id="btn-go-prompter"
              @click="handleToggleMode"
              class="pill-btn go-prompter-btn"
              title="Switch to Prompter">
              <MonitorPlay :size="18" />
            </button>
          </div>

          <div class="pill-divider" />

          <!-- CENTER: Settings toggle -->
          <div class="pill-section">
            <button id="btn-settings" @click="panelOpen = !panelOpen"
              class="pill-btn settings-btn" :class="{ 'panel-active': panelOpen }"
              title="Adjust Speed, Font &amp; Leading">
              <SlidersHorizontal :size="16" />
              <span class="settings-chip-label">Adjust</span>
            </button>
          </div>

          <div class="pill-divider" />

          <!-- RIGHT: Utility (no mode toggle — handled in left section) -->
          <div class="pill-section util-section">
            <button id="btn-camera"
              @click="toggleCamera"
              class="pill-btn camera-btn" :class="{ 'is-active': settings.cameraEnabled }"
              title="Toggle Camera">
              <Camera :size="16" />
            </button>

            <button id="btn-mirror"
              @click="settings.mirrorMode = !settings.mirrorMode"
              class="pill-btn mirror-btn" :class="{ 'is-active': settings.mirrorMode }"
              title="Mirror Mode">
              <FlipHorizontal :size="16" />
            </button>

            <button v-if="!isIos" id="btn-fullscreen" @click="toggleFullscreen"
              class="pill-btn fullscreen-btn" title="Fullscreen">
              <Maximize :size="16" />
            </button>

            <button id="btn-hide" @click="isManuallyHidden = true"
              class="pill-btn hide-btn" title="Hide Controls">
              <EyeOff :size="16" />
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import {
  Play, Pause, RotateCcw, Gauge, Type, AlignJustify,
  FlipHorizontal, Edit3, MonitorPlay, Maximize, Eye, EyeOff,
  Camera, SlidersHorizontal, X
} from 'lucide-vue-next'
import { Capacitor } from '@capacitor/core'

const isIos = Capacitor.getPlatform() === 'ios'

const { settings } = inject('settings')
const isPlaying   = inject('isPlaying')
const togglePlay  = inject('togglePlay')
const reset       = inject('reset')
const isEditorMode    = inject('isEditorMode')
const setIsEditorMode = inject('setIsEditorMode')
const hideToolbar     = inject('hideToolbar')

const isManuallyHidden = ref(false)
const panelOpen        = ref(false)

watch(isEditorMode, (val) => { if (val) isManuallyHidden.value = false })

const handleTogglePlay = () => togglePlay()
const handleReset = () => reset()

const toggleMode = () => {
  setIsEditorMode(!isEditorMode.value)
  if (!isEditorMode.value && isPlaying.value) togglePlay()
  panelOpen.value = false
}
const handleToggleMode = () => toggleMode()

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

const toggleCamera = () => {
  settings.value.cameraEnabled = !settings.value.cameraEnabled
  if (settings.value.cameraEnabled) {
    panelOpen.value = false
  }
}
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────── */
.toolbar-root {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 10010;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px calc(env(safe-area-inset-bottom) + 18px);
  gap: 10px;
  pointer-events: none;
}

/* ── Slider panel ──────────────────────────────────────────────── */
.slider-panel {
  pointer-events: auto;
  width: min(340px, calc(100vw - 32px));
  background: rgba(12, 12, 16, 0.88);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 20px;
  padding: 14px 16px 16px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.panel-close {
  background: rgba(255, 255, 255, 0.07);
  border: none;
  color: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.panel-close:hover { background: rgba(255,255,255,0.13); color: #fff; }

/* Panel rows */
.panel-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-row-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 68px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.78rem;
  font-weight: 500;
}

.panel-icon { flex-shrink: 0; }
.speed-icon { color: #f59e0b; }
.font-icon  { color: #60a5fa; }
.line-icon  { color: #34d399; }

.panel-row-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Vertical track (horizontal range rendered wide) */
.vtrack {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.speed-track { background: linear-gradient(to right, #f59e0b var(--pct, 50%), rgba(255,255,255,0.10) var(--pct, 50%)); }
.font-track  { background: linear-gradient(to right, #3b82f6 var(--pct, 50%), rgba(255,255,255,0.10) var(--pct, 50%)); }
.line-track  { background: linear-gradient(to right, #10b981 var(--pct, 50%), rgba(255,255,255,0.10) var(--pct, 50%)); }

/* Fallback solid bg for browsers that don't support the gradient trick */
.vtrack { background: rgba(255,255,255,0.12); }
.speed-track { background: rgba(245,158,11,0.25); }
.font-track  { background: rgba(59,130,246,0.25); }
.line-track  { background: rgba(16,185,129,0.25); }

.vtrack::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.55);
  transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1);
}
.vtrack::-webkit-slider-thumb:hover { transform: scale(1.25); }

.vtrack::-moz-range-thumb {
  width: 18px; height: 18px;
  border-radius: 50%; background: #fff;
  border: none; cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.55);
}

.vval {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.75);
  min-width: 36px;
  text-align: right;
  white-space: nowrap;
}
.vval em { font-style: normal; font-size: 0.62rem; opacity: 0.55; margin-left: 1px; }

/* ── Toolbar pill ──────────────────────────────────────────────── */
.toolbar-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(14, 14, 18, 0.85);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  padding: 7px 10px;
  box-shadow:
    0 24px 60px rgba(0,0,0,0.55),
    0 4px 16px rgba(0,0,0,0.35),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

.pill-section {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
}

.util-section { gap: 3px; }

.pill-divider {
  width: 1px;
  height: 26px;
  background: rgba(255,255,255,0.08);
  flex-shrink: 0;
  margin: 0 2px;
}

/* ── Base button ───────────────────────────────────────────────── */
.pill-btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  flex-shrink: 0;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.12s cubic-bezier(0.34,1.56,0.64,1);
}
.pill-btn:active { transform: scale(0.88) !important; }

/* ── Play ── */
.play-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,235,0.45);
}
.play-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 6px 18px rgba(37,99,235,0.55);
  transform: scale(1.06);
}
.play-btn.playing {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 14px rgba(217,119,6,0.45);
}
.play-btn.playing:hover {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

/* ── Reset ── */
.reset-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
}
.reset-btn:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
  transform: rotate(-30deg) scale(1.05);
}

/* ── Go to Prompter (editor mode, left — icon only) ── */
.go-prompter-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 4px 16px rgba(16,185,129,0.45);
  animation: prompter-pulse 2.6s ease-in-out infinite;
}
.go-prompter-btn:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 6px 20px rgba(16,185,129,0.6);
  transform: scale(1.07);
}
@keyframes prompter-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(16,185,129,0.45); }
  50%       { box-shadow: 0 4px 26px rgba(16,185,129,0.75); }
}

/* ── Go to Editor (prompter mode, beside reset) ── */
.edit-mode-btn {
  background: rgba(16,185,129,0.14);
  color: #34d399;
  box-shadow: inset 0 0 0 1px rgba(16,185,129,0.25);
}
.edit-mode-btn:hover {
  background: rgba(16,185,129,0.24);
  color: #6ee7b7;
  box-shadow: inset 0 0 0 1px rgba(16,185,129,0.4), 0 0 12px rgba(16,185,129,0.25);
}

/* ── Settings toggle ── */
.settings-btn {
  width: auto;
  padding: 0 14px;
  gap: 7px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
  font-size: 0.78rem;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
}
.settings-btn:hover {
  background: rgba(255,255,255,0.11);
  color: #fff;
}
.settings-btn.panel-active {
  background: rgba(99,102,241,0.18);
  color: #a5b4fc;
  box-shadow: inset 0 0 0 1px rgba(99,102,241,0.35);
}

.settings-chip-label {
  letter-spacing: 0.01em;
}

/* ── Camera ── */
.camera-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
}
.camera-btn:hover {
  background: rgba(20,184,166,0.15);
  color: #2dd4bf;
}
.camera-btn.is-active {
  background: rgba(20,184,166,0.22);
  color: #2dd4bf;
  box-shadow: inset 0 0 0 1px rgba(20,184,166,0.35), 0 0 10px rgba(20,184,166,0.2);
}

/* ── Mirror ── */
.mirror-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
}
.mirror-btn:hover {
  background: rgba(139,92,246,0.15);
  color: #c4b5fd;
}
.mirror-btn.is-active {
  background: rgba(139,92,246,0.22);
  color: #c4b5fd;
  box-shadow: inset 0 0 0 1px rgba(139,92,246,0.35), 0 0 10px rgba(139,92,246,0.2);
}

/* ── Mode ── */
.mode-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.45);
}
.mode-btn:hover {
  background: rgba(16,185,129,0.13);
  color: #6ee7b7;
}
.mode-btn.prompter-active {
  background: rgba(16,185,129,0.2);
  color: #34d399;
  box-shadow: inset 0 0 0 1px rgba(16,185,129,0.3), 0 0 10px rgba(16,185,129,0.2);
}

/* ── Fullscreen ── */
.fullscreen-btn {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
}
.fullscreen-btn:hover {
  background: rgba(251,191,36,0.13);
  color: #fde68a;
}

/* ── Hide ── */
.hide-btn {
  background: transparent;
  color: rgba(255,255,255,0.22);
}
.hide-btn:hover {
  background: rgba(239,68,68,0.12);
  color: #fca5a5;
}

/* ── Mode chip (editor label) ── */
.mode-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.25);
  color: #a5b4fc;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

/* ── Show orb ──────────────────────────────────────────────────── */
.show-orb {
  pointer-events: auto;
  position: fixed;
  right: 20px;
  bottom: calc(env(safe-area-inset-bottom) + 18px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(14,14,18,0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  transition: color 0.15s, background 0.15s, transform 0.15s;
}
.show-orb:hover { color: #fff; transform: scale(1.08); }

/* ── Transitions ───────────────────────────────────────────────── */
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
}
.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.pill-expand-enter-active,
.pill-expand-leave-active {
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
}
.pill-expand-enter-from,
.pill-expand-leave-to {
  transform: translateY(16px) scale(0.94);
  opacity: 0;
}

.orb-pop-enter-active,
.orb-pop-leave-active {
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
}
.orb-pop-enter-from,
.orb-pop-leave-to {
  transform: scale(0.4);
  opacity: 0;
}

.panel-pop-enter-active,
.panel-pop-leave-active {
  transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease;
}
.panel-pop-enter-from,
.panel-pop-leave-to {
  transform: translateY(12px) scale(0.96);
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 420px) {
  .toolbar-root { padding: 0 10px calc(env(safe-area-inset-bottom) + 12px); gap: 8px; }
  .toolbar-pill { padding: 6px 8px; }
  .pill-btn { width: 34px; height: 34px; }
  .settings-btn { padding: 0 10px; }
  .settings-chip-label { display: none; }
  .slider-panel { width: calc(100vw - 20px); }
}
</style>
