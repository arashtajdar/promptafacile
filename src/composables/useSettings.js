import { ref, watch } from 'vue'

const defaultSettings = {
  script: 'Welcome to your Teleprompter!\n\nPaste your script here.\n\nUse the controls above to start scrolling, adjust speed, and text size.',
  speed: 1, // 0.2x to 10x
  fontSize: 60, // 20px to 120px
  lineHeight: 1.5, // 1.0 to 3.0
  mirrorMode: false,
  lastScrollPosition: 0
}

export function useSettings() {
  const settings = ref({ ...defaultSettings })

  // Load from localStorage
  const saved = localStorage.getItem('teleprompterSettings')
  if (saved) {
    try {
      settings.value = { ...defaultSettings, ...JSON.parse(saved) }
    } catch (e) {
      console.error('Failed to parse settings')
    }
  }

  // Save on change
  watch(settings, (newSettings) => {
    localStorage.setItem('teleprompterSettings', JSON.stringify(newSettings))
  }, { deep: true })

  return {
    settings
  }
}
