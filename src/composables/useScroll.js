import { ref, onMounted, onUnmounted } from 'vue'

export function useScroll(settingsRef) {
  const isPlaying = ref(false)
  const scrollY = ref(settingsRef ? settingsRef.value.lastScrollPosition : 0) // Internal state for translate
  const maxScroll = ref(0)
  
  let animationFrameId = null
  let lastTime = 0
  
  const start = () => {
    if (!isPlaying.value) {
      isPlaying.value = true
      lastTime = performance.now()
      animationFrameId = requestAnimationFrame(tick)
    }
  }
  
  const pause = () => {
    if (isPlaying.value) {
      isPlaying.value = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      if (settingsRef) {
        settingsRef.value.lastScrollPosition = scrollY.value
      }
    }
  }
  
  const toggle = () => {
    if (isPlaying.value) pause()
    else start()
  }
  
  const reset = () => {
    scrollY.value = 0
    if (settingsRef) {
      settingsRef.value.lastScrollPosition = 0
    }
  }

  const tick = (currentTime) => {
    if (!isPlaying.value) return
    
    const deltaTime = currentTime - lastTime
    lastTime = currentTime
    
    // Calculate pixels to move. Base speed can be e.g. 50px per second when speed = 1
    const baseSpeed = 50 // pixels per second
    const speed = settingsRef ? settingsRef.value.speed : 1
    const pixels = (baseSpeed * speed * deltaTime) / 1000
    
    scrollY.value += pixels
    if (settingsRef) {
      settingsRef.value.lastScrollPosition = scrollY.value
    }
    
    // Assuming maxScroll is set by the component monitoring content height
    if (maxScroll.value > 0 && scrollY.value >= maxScroll.value) {
      scrollY.value = maxScroll.value
      pause()
      return
    }
    
    animationFrameId = requestAnimationFrame(tick)
  }
  
  onUnmounted(() => {
    pause()
  })

  return {
    isPlaying,
    scrollY,
    maxScroll,
    start,
    pause,
    toggle,
    reset
  }
}
