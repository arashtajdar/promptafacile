import { ref } from 'vue'

const logs = ref([])
const showDebugConsole = ref(false)

// Capture original console methods
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args) => {
  originalLog.apply(console, args)
  logs.value.push({
    type: 'log',
    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
    time: new Date().toLocaleTimeString()
  })
}

console.error = (...args) => {
  originalError.apply(console, args)
  logs.value.push({
    type: 'error',
    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
    time: new Date().toLocaleTimeString()
  })
}

console.warn = (...args) => {
  originalWarn.apply(console, args)
  logs.value.push({
    type: 'warn',
    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
    time: new Date().toLocaleTimeString()
  })
}

// Catch unhandled runtime errors
window.addEventListener('error', (event) => {
  console.error(`Unhandled error: ${event.message} at ${event.filename}:${event.lineno}`)
})

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error(`Unhandled Promise rejection: ${event.reason}`)
})

export function useDebug() {
  const clearLogs = () => {
    logs.value = []
  }

  return {
    logs,
    showDebugConsole,
    clearLogs
  }
}
