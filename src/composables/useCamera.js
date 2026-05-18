import { ref } from 'vue'
import { CameraPreview } from '@capacitor-community/camera-preview'
import { Capacitor } from '@capacitor/core'

export function useCamera() {
  const isRecording = ref(false)
  const isCameraActive = ref(false)

  // Web fallback states
  let webStream = null
  let webVideoElement = null
  let mediaRecorder = null
  let recordedChunks = []

  const startCamera = async () => {
    if (!Capacitor.isNative()) {
      // Web fallback
      try {
        let stream
        try {
          // Attempt front camera by preference and ask for both audio and video
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          })
        } catch (err) {
          console.warn('Failed to get camera with audio, trying video only...', err)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
          })
        }

        webStream = stream

        // Find or create web video preview element
        let video = document.getElementById('web-camera-preview')
        if (!video) {
          video = document.createElement('video')
          video.id = 'web-camera-preview'
          video.style.position = 'fixed'
          video.style.top = '0'
          video.style.left = '0'
          video.style.width = '100vw'
          video.style.height = '100vh'
          video.style.objectFit = 'cover'
          video.style.zIndex = '-1'
          video.style.transform = 'scaleX(-1)' // Mirror front camera preview
          video.style.pointerEvents = 'none'
          video.autoplay = true
          video.playsInline = true
          video.muted = true // Must be muted to prevent feedback loop
          document.body.appendChild(video)
        }

        video.srcObject = stream
        webVideoElement = video
        isCameraActive.value = true
      } catch (e) {
        console.error('Failed to start web camera:', e)
        alert('Could not access camera. Please make sure camera permissions are granted in your browser settings.')
      }
      return
    }

    // Native Capacitor logic
    try {
      await CameraPreview.start({
        position: 'front',
        parent: 'app',
        className: 'camera-preview',
        toBack: true, // Crucial for overlaying web UI
        transparent: true
      })
      isCameraActive.value = true
    } catch (e) {
      console.error('Failed to start native camera', e)
    }
  }

  const stopCamera = async () => {
    if (!Capacitor.isNative()) {
      // Web fallback
      try {
        if (isRecording.value) {
          await stopRecording()
        }
        if (webStream) {
          webStream.getTracks().forEach(track => track.stop())
          webStream = null
        }
        if (webVideoElement) {
          webVideoElement.remove()
          webVideoElement = null
        }
        isCameraActive.value = false
      } catch (e) {
        console.error('Failed to stop web camera', e)
      }
      return
    }

    // Native Capacitor logic
    try {
      if (isRecording.value) {
        await stopRecording()
      }
      await CameraPreview.stop()
      isCameraActive.value = false
    } catch (e) {
      console.error('Failed to stop native camera', e)
    }
  }

  const startRecording = async () => {
    if (!Capacitor.isNative()) {
      // Web fallback MediaRecorder recording
      if (!webStream) {
        console.error('No camera stream found to record')
        return
      }
      try {
        recordedChunks = []
        
        // Select an appropriate mimetype
        let options = { mimeType: 'video/webm;codecs=vp9,opus' }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm;codecs=vp8,opus' }
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' }
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/mp4' }
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = {} // System default
        }

        mediaRecorder = new MediaRecorder(webStream, options)
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' })
          const url = URL.createObjectURL(blob)
          
          // Trigger a clean auto-download for web users
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `teleprompter-recording-${Date.now()}.webm`
          document.body.appendChild(a)
          a.click()
          
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 100)
          
          alert('Recording completed! Video downloaded to your device.')
        }

        mediaRecorder.start(1000) // Chunk every 1s
        isRecording.value = true
      } catch (e) {
        console.error('Failed to start web recording:', e)
        alert('Could not start video recording. MediaRecorder is not supported or failed to initialize.')
      }
      return
    }

    // Native Capacitor logic
    try {
      await CameraPreview.startRecordVideo({
        cameraDirection: 'front',
        width: 1080,
        height: 1920,
        quality: 100,
        withFlash: false
      })
      isRecording.value = true
    } catch (e) {
      console.error('Failed to start native recording', e)
    }
  }

  const stopRecording = async () => {
    if (!Capacitor.isNative()) {
      // Web fallback
      try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
        }
        isRecording.value = false
      } catch (e) {
        console.error('Failed to stop web recording:', e)
      }
      return
    }

    // Native Capacitor logic
    try {
      const result = await CameraPreview.stopRecordVideo()
      isRecording.value = false
      
      console.log('Video saved to:', result.videoFilePath)
      if (result && result.videoFilePath) {
        alert('Video saved successfully! Check your gallery/files.')
      }
    } catch (e) {
      console.error('Failed to stop native recording', e)
      isRecording.value = false
    }
  }

  return {
    isCameraActive,
    isRecording,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording
  }
}

