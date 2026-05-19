import { ref } from 'vue'
import { CameraPreview } from '@capacitor-community/camera-preview'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Media } from '@capacitor-community/media'

export function useCamera() {
  const isRecording = ref(false)
  const isCameraActive = ref(false)
  const currentResolution = ref('1080p')
  const currentFPS = ref(30)
  const saveStatusLog = ref('')

  // Web fallback states
  let webStream = null
  let webVideoElement = null
  let mediaRecorder = null
  let recordedChunks = []

  const startCamera = async () => {
    if (!Capacitor.isNative) {
      // Web fallback
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Web Camera API (navigator.mediaDevices.getUserMedia) is undefined. Camera access REQUIRES a secure connection (HTTPS) or localhost. Please verify your Railway deployment is using HTTPS and camera permissions are granted in Safari settings.')
        }

        const heightConstraint = currentResolution.value === '4k' ? 2160 : (currentResolution.value === '720p' ? 720 : 1080)
        const widthConstraint = currentResolution.value === '4k' ? 3840 : (currentResolution.value === '720p' ? 1280 : 1920)
        const fpsConstraint = currentFPS.value

        let stream
        try {
          // Attempt front camera by preference and ask for both audio and video
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: widthConstraint }, 
              height: { ideal: heightConstraint },
              frameRate: { ideal: fpsConstraint }
            },
            audio: true
          })
        } catch (err) {
          console.warn('Failed to get camera with audio, trying video only...', err)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: widthConstraint }, 
              height: { ideal: heightConstraint },
              frameRate: { ideal: fpsConstraint }
            }
          })
        }

        webStream = stream

        // Find or create web video preview element
        let video = document.getElementById('web-camera-preview')
        if (!video) {
          video = document.createElement('video')
          video.id = 'web-camera-preview'
          video.setAttribute('autoplay', '')
          video.setAttribute('playsinline', '')
          video.setAttribute('muted', '')
          video.style.position = 'fixed'
          video.style.top = '50%'
          video.style.left = '50%'
          video.style.transform = 'translate(-50%, -50%) scaleX(-1)' // Center and mirror
          video.style.width = '90vw'
          video.style.height = '75vh'
          video.style.maxWidth = '480px'
          video.style.maxHeight = '720px'
          video.style.objectFit = 'cover'
          video.style.borderRadius = '24px'
          video.style.border = '3px solid rgba(255, 255, 255, 0.15)'
          video.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          video.style.zIndex = '0' // Float above the dark body background, behind scrolling text
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
        toBack: true // Crucial for overlaying web UI behind the WebView
      })
      isCameraActive.value = true

      try {
        await CameraPreview.setResolutionAndFrameRate({
          resolution: currentResolution.value,
          fps: currentFPS.value
        })
      } catch (presetError) {
        console.warn('Failed to apply initial resolution and frame rate settings:', presetError)
      }
    } catch (e) {
      console.error('Failed to start native camera', e)
    }
  }

  const stopCamera = async () => {
    if (!Capacitor.isNative) {
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
    if (!Capacitor.isNative) {
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
      const widthVal = currentResolution.value === '4k' ? 2160 : (currentResolution.value === '720p' ? 720 : 1080)
      const heightVal = currentResolution.value === '4k' ? 3840 : (currentResolution.value === '720p' ? 1280 : 1920)

      await CameraPreview.startRecordVideo({
        cameraDirection: 'front',
        width: widthVal,
        height: heightVal,
        quality: 100,
        withFlash: false
      })
      isRecording.value = true
    } catch (e) {
      console.error('Failed to start native recording', e)
    }
  }

  const stopRecording = async () => {
    if (!Capacitor.isNative) {
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
      saveStatusLog.value = 'Stopping recording natively...'
      const result = await CameraPreview.stopRecordVideo()
      isRecording.value = false
      
      saveStatusLog.value = `Stop completed. Native path: ${result?.videoFilePath}`
      console.log('Video saved to:', result?.videoFilePath)
      if (result && result.videoFilePath) {
        if (Capacitor.getPlatform() === 'android') {
          try {
            saveStatusLog.value = 'Requesting Android permissions...'
            await Media.requestPermissions()
            saveStatusLog.value = 'Saving to Android gallery...'
            await Media.saveVideo({
              path: result.videoFilePath
            })
            saveStatusLog.value = `Successfully saved to Android gallery! File: ${result.videoFilePath}`
          } catch (androidSaveError) {
            saveStatusLog.value = `Android save failed: ${androidSaveError.message || androidSaveError}. Falling back to Share.`
            let filePath = result.videoFilePath
            if (!filePath.startsWith('file://')) {
              filePath = 'file://' + filePath
            }
            await Share.share({
              title: 'PromptaFacile Recording',
              text: 'Here is your recorded teleprompter video!',
              files: [filePath],
              dialogTitle: 'Save or Share Video'
            })
            return
          }
        } else {
          // On iOS
          saveStatusLog.value = `Saved on iOS. Natively saved via UISaveVideoAtPathToSavedPhotosAlbum to Photos Library. Temp path: ${result.videoFilePath}`
        }
        alert('Video successfully saved to your Photos gallery!')
      } else {
        saveStatusLog.value = 'Error: No videoFilePath returned from CameraPreview.stopRecordVideo()'
      }
    } catch (e) {
      saveStatusLog.value = `Recording stop failed: ${e.message || e}`
      console.error('Failed to stop native recording', e)
      isRecording.value = false
    }
  }

  const setResolutionAndFrameRate = async (resolution, fps) => {
    currentResolution.value = resolution
    currentFPS.value = fps

    if (!isCameraActive.value) return

    if (Capacitor.isNative) {
      try {
        await CameraPreview.setResolutionAndFrameRate({
          resolution,
          fps
        })
      } catch (e) {
        console.error('Failed to set native resolution and frame rate:', e)
      }
    } else {
      // Re-initialize web camera with new constraints
      try {
        if (webStream) {
          webStream.getTracks().forEach(track => track.stop())
        }
        
        const heightConstraint = resolution === '4k' ? 2160 : (resolution === '720p' ? 720 : 1080)
        const widthConstraint = resolution === '4k' ? 3840 : (resolution === '720p' ? 1280 : 1920)
        
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: widthConstraint }, 
              height: { ideal: heightConstraint },
              frameRate: { ideal: fps }
            },
            audio: true
          })
        } catch (err) {
          console.warn('Failed to get camera with audio, trying video only...', err)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: widthConstraint }, 
              height: { ideal: heightConstraint },
              frameRate: { ideal: fps }
            }
          })
        }
        
        webStream = stream
        if (webVideoElement) {
          webVideoElement.srcObject = stream
        }
      } catch (e) {
        console.error('Failed to set web resolution/fps:', e)
      }
    }
  }

  return {
    isCameraActive,
    isRecording,
    currentResolution,
    currentFPS,
    saveStatusLog,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    setResolutionAndFrameRate
  }
}

