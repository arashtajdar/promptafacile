import { ref, onMounted, onUnmounted } from 'vue'

export function useScroll(settingsRef) {
  const isPlaying = ref(false)
  const scrollY = ref(settingsRef && settingsRef.value && typeof settingsRef.value.lastScrollPosition === 'number' && !isNaN(settingsRef.value.lastScrollPosition) ? settingsRef.value.lastScrollPosition : 0) // Internal state for translate
  const maxScroll = ref(0)
  
  let animationFrameId = null
  let lastTime = 0
  let tickCount = 0
  
  const start = () => {
    console.log('[useScroll] start() called, current isPlaying:', isPlaying.value)
    if (!isPlaying.value) {
      tickCount = 0
      if (maxScroll.value > 0 && scrollY.value >= maxScroll.value) {
        console.log('[useScroll] scrollY is past maxScroll, resetting to 0 before start. scrollY:', scrollY.value, 'maxScroll:', maxScroll.value)
        scrollY.value = 0
      }
      isPlaying.value = true
      lastTime = performance.now()
      animationFrameId = requestAnimationFrame(tick)
      console.log('[useScroll] requestAnimationFrame started, animationFrameId:', animationFrameId)
    }
  }
  
  const pause = () => {
    console.log('[useScroll] pause() called, current isPlaying:', isPlaying.value)
    if (isPlaying.value) {
      isPlaying.value = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        console.log('[useScroll] cancelAnimationFrame called for animationFrameId:', animationFrameId)
        animationFrameId = null
      }
      if (settingsRef) {
        settingsRef.value.lastScrollPosition = scrollY.value
      }
    }
  }
  
  const toggle = () => {
    console.log('[useScroll] toggle() called')
    if (isPlaying.value) pause()
    else start()
  }
  
  const reset = () => {
    console.log('[useScroll] reset() called')
    scrollY.value = 0
    if (settingsRef) {
      settingsRef.value.lastScrollPosition = 0
    }
  }

  const tick = (currentTime) => {
    if (!isPlaying.value) {
      console.log('[useScroll] tick aborted because isPlaying is false')
      return
    }
    
    const now = (typeof currentTime === 'number') ? currentTime : performance.now()
    const deltaTime = now - lastTime
    lastTime = now
    
    tickCount++
    if (tickCount <= 5) {
      console.log(`[useScroll] tick #${tickCount}. now:`, now, 'lastTime:', lastTime, 'deltaTime:', deltaTime, 'scrollY:', scrollY.value)
    }
    
    // Calculate pixels to move. Base speed can be e.g. 50px per second when speed = 1
    const baseSpeed = 50 // pixels per second
    const speed = (settingsRef && settingsRef.value) ? settingsRef.value.speed : 1
    const pixels = (baseSpeed * speed * deltaTime) / 1000
    
    scrollY.value += pixels
    if (settingsRef) {
      settingsRef.value.lastScrollPosition = scrollY.value
    }
    
    // Assuming maxScroll is set by the component monitoring content height
    if (maxScroll.value > 0 && scrollY.value >= maxScroll.value) {
      console.log('[useScroll] reached end of content. scrollY:', scrollY.value, 'maxScroll:', maxScroll.value)
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
