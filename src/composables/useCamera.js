import { ref } from 'vue'
import { CameraPreview } from '@capacitor-community/camera-preview'

export function useCamera() {
  const isRecording = ref(false)
  const isCameraActive = ref(false)

  const startCamera = async () => {
    try {
      await CameraPreview.start({
        position: 'front',
        parent: 'app',
        className: 'camera-preview',
        toBack: true, // This is crucial so our web UI stays on top
        transparent: true // Webview needs to be transparent
      })
      isCameraActive.value = true
    } catch (e) {
      console.error('Failed to start camera', e)
    }
  }

  const stopCamera = async () => {
    try {
      if (isRecording.value) {
        await stopRecording()
      }
      await CameraPreview.stop()
      isCameraActive.value = false
    } catch (e) {
      console.error('Failed to stop camera', e)
    }
  }

  const startRecording = async () => {
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
      console.error('Failed to start recording', e)
    }
  }

  const stopRecording = async () => {
    try {
      const result = await CameraPreview.stopRecordVideo()
      isRecording.value = false
      
      // result.videoFilePath contains the path to the recorded video
      console.log('Video saved to:', result.videoFilePath)
      
      // Assuming user wants to share or save the file
      // We could use @capacitor/share here to prompt the user to save it
      if (result && result.videoFilePath) {
        // If we want to share the video directly:
        // await Share.share({ url: result.videoFilePath })
        alert('Video saved successfully! Check your gallery/files.')
      }
    } catch (e) {
      console.error('Failed to stop recording', e)
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
