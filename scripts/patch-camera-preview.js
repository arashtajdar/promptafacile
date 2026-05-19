import fs from 'fs';
import path from 'path';

const controllerPath = path.resolve('node_modules/@capacitor-community/camera-preview/ios/Sources/CameraPreviewPlugin/CameraController.swift');
const pluginPath = path.resolve('node_modules/@capacitor-community/camera-preview/ios/Sources/CameraPreviewPlugin/CameraPreviewPlugin.swift');
const androidPath = path.resolve('node_modules/@capacitor-community/camera-preview/android/src/main/java/com/ahm/capacitor/camera/preview/CameraPreview.java');

// Helper to replace or insert safely
function replaceOnce(filePath, target, replacement) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(replacement)) {
    console.log(`Already patched in ${path.basename(filePath)}`);
    return true;
  }
  if (!content.includes(target)) {
    console.error(`Target not found in ${path.basename(filePath)}: "${target}"`);
    return false;
  }
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully patched ${path.basename(filePath)}`);
  return true;
}

// 1. Patch CameraController.swift
if (fs.existsSync(controllerPath)) {
  let content = fs.readFileSync(controllerPath, 'utf8');

  // Add properties if not already present
  if (!content.includes('var videoOutput: AVCaptureMovieFileOutput?')) {
    const target = 'var zoomFactor: CGFloat = 1.0';
    content = content.replace(
      target,
      `var videoOutput: AVCaptureMovieFileOutput?\n    var videoRecordCompletionBlock: ((URL?, Error?) -> Void)?\n    ${target}`
    );
  }

  // Add configureVideoOutput helper inside prepare() if not already present
  if (!content.includes('func configureVideoOutput()')) {
    const target = 'func configureDataOutput() throws {';
    const helper = `func configureVideoOutput() throws {
            guard let captureSession = self.captureSession else { throw CameraControllerError.captureSessionIsMissing }

            self.videoOutput = AVCaptureMovieFileOutput()
            if captureSession.canAddOutput(self.videoOutput!) {
                captureSession.addOutput(self.videoOutput!)
            } else {
                throw CameraControllerError.inputsAreInvalid
            }
        }\n\n        ${target}`;
    content = content.replace(target, helper);
  }

  // Uncomment try configureVideoOutput() inside prepare() if not already done
  content = content.replace(
    '// try configureVideoOutput()',
    'try configureVideoOutput()'
  );

  // Patch captureVideo, stopRecording, and add setResolutionAndFrameRate
  const captureMethodStart = 'func captureVideo(completion: @escaping (URL?, Error?) -> Void) {';
  const stopMethodStart = 'func stopRecording(completion: @escaping (Error?) -> Void) {';
  
  if (content.includes(captureMethodStart) && content.includes(stopMethodStart)) {
    // We can extract and replace the entire region of captureVideo/stopRecording
    const startIdx = content.indexOf(captureMethodStart);
    const endIdx = content.indexOf('}', content.indexOf('}', startIdx + captureMethodStart.length) + 1); // find matching closure end
    
    if (startIdx !== -1 && endIdx !== -1) {
      const originalBlock = content.substring(startIdx, endIdx + 1);
      const replacementBlock = `func captureVideo(completion: @escaping (URL?, Error?) -> Void) {
        guard let captureSession = self.captureSession, captureSession.isRunning else {
            completion(nil, CameraControllerError.captureSessionIsMissing)
            return
        }
        let path = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let identifier = UUID()
        let randomIdentifier = identifier.uuidString.replacingOccurrences(of: "-", with: "")
        let finalIdentifier = String(randomIdentifier.prefix(8))
        let fileName="cpcp_video_"+finalIdentifier+".mp4"

        let fileUrl = path.appendingPathComponent(fileName)
        try? FileManager.default.removeItem(at: fileUrl)
        
        self.videoRecordCompletionBlock = completion
        self.videoOutput?.startRecording(to: fileUrl, recordingDelegate: self)
    }

    func stopRecording(completion: @escaping (Error?) -> Void) {
        guard let captureSession = self.captureSession, captureSession.isRunning else {
            completion(CameraControllerError.captureSessionIsMissing)
            return
        }
        if let videoOutput = self.videoOutput, videoOutput.isRecording {
            videoOutput.stopRecording()
            completion(nil)
        } else {
            completion(nil)
        }
    }

    func setResolutionAndFrameRate(resolution: String, fps: Int) throws {
        guard let captureSession = self.captureSession else {
            throw CameraControllerError.captureSessionIsMissing
        }

        guard let device = (self.currentCameraPosition == .front ? self.frontCamera : self.rearCamera) else {
            throw CameraControllerError.noCamerasAvailable
        }

        captureSession.beginConfiguration()

        let preset: AVCaptureSession.Preset
        switch resolution.lowercased() {
        case "4k":
            preset = .hd4K3840x2160
        case "720p":
            preset = .hd1280x720
        case "1080p":
            fallthrough
        default:
            preset = .hd1920x1080
        }

        if captureSession.canSetSessionPreset(preset) {
            captureSession.sessionPreset = preset
        }

        try device.lockForConfiguration()

        var selectedFormat: AVCaptureDevice.Format? = nil
        let formats = device.formats
        for format in formats {
            let ranges = format.videoSupportedFrameRateRanges
            for range in ranges {
                if range.maxFrameRate >= Double(fps) && range.minFrameRate <= Double(fps) {
                    selectedFormat = format
                    break
                }
            }
            if selectedFormat != nil { break }
        }

        if let format = selectedFormat {
            device.activeFormat = format
        }

        let frameDuration = CMTime(value: 1, timescale: CMTimeScale(fps))
        device.activeVideoMinFrameDuration = frameDuration
        device.activeVideoMaxFrameDuration = frameDuration

        device.unlockForConfiguration()

        captureSession.commitConfiguration()
    }`;
      content = content.replace(originalBlock, replacementBlock);
    }
  }

  // Patch the delegate implementation
  const delegateStart = 'extension CameraController: AVCaptureFileOutputRecordingDelegate {';
  if (content.includes(delegateStart)) {
    const startIdx = content.indexOf(delegateStart);
    const endIdx = content.indexOf('}', startIdx + delegateStart.length);
    if (startIdx !== -1 && endIdx !== -1) {
      const originalDelegate = content.substring(startIdx, endIdx + 1);
      const replacementDelegate = `extension CameraController: AVCaptureFileOutputRecordingDelegate {
    public func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        if error == nil {
            self.videoRecordCompletionBlock?(outputFileURL, nil)
        } else {
            self.videoRecordCompletionBlock?(outputFileURL, error)
        }
    }
}`;
      content = content.replace(originalDelegate, replacementDelegate);
    }
  }

  fs.writeFileSync(controllerPath, content, 'utf8');
  console.log('Successfully patched CameraController.swift');
} else {
  console.error('CameraController.swift not found at', controllerPath);
}

// 2. Patch CameraPreviewPlugin.swift
if (fs.existsSync(pluginPath)) {
  let content = fs.readFileSync(pluginPath, 'utf8');

  // Add recordCall property if not already present
  if (!content.includes('var recordCall: CAPPluginCall?')) {
    const target = 'var disableAudio: Bool = false';
    content = content.replace(
      target,
      `${target}\n    var recordCall: CAPPluginCall?`
    );
  }

  // Register setResolutionAndFrameRate method in pluginMethods list
  if (!content.includes('CAPPluginMethod(name: "setResolutionAndFrameRate"')) {
    const target = 'CAPPluginMethod(name: "isCameraStarted", returnType: CAPPluginReturnPromise)';
    content = content.replace(
      target,
      `CAPPluginMethod(name: "setResolutionAndFrameRate", returnType: CAPPluginReturnPromise),\n        ${target}`
    );
  }

  // Replace startRecordVideo, stopRecordVideo, and add setResolutionAndFrameRate method
  const startMethodStart = '@objc func startRecordVideo(_ call: CAPPluginCall) {';
  if (content.includes(startMethodStart)) {
    const startIdx = content.indexOf(startMethodStart);
    const stopMethodStart = '@objc func stopRecordVideo(_ call: CAPPluginCall) {';
    const stopIdx = content.indexOf(stopMethodStart);
    if (startIdx !== -1 && stopIdx !== -1) {
      const endOfStopIdx = content.indexOf('}', content.indexOf('}', stopIdx + stopMethodStart.length) + 1);
      if (endOfStopIdx !== -1) {
        const originalBlock = content.substring(startIdx, endOfStopIdx + 1);
        const replacementBlock = `@objc func startRecordVideo(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.cameraController.captureVideo { [weak self] (videoUrl, error) in
                guard let self = self else { return }
                
                DispatchQueue.main.async {
                    guard let recordCall = self.recordCall else {
                        return
                    }
                    
                    if let error = error {
                        recordCall.reject(error.localizedDescription)
                    } else if let videoUrl = videoUrl {
                        recordCall.resolve(["videoFilePath": videoUrl.absoluteString])
                    } else {
                        recordCall.reject("Recording failed: no video URL received")
                    }
                    self.recordCall = nil
                }
            }
            call.resolve()
        }
    }

    @objc func stopRecordVideo(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.recordCall = call
            self.cameraController.stopRecording { [weak self] error in
                guard let self = self else { return }
                if let error = error {
                    call.reject(error.localizedDescription)
                    self.recordCall = nil
                }
            }
        }
    }

    @objc func setResolutionAndFrameRate(_ call: CAPPluginCall) {
        let resolution = call.getString("resolution") ?? "1080p"
        let fps = call.getInt("fps") ?? 30
        
        DispatchQueue.main.async {
            do {
                try self.cameraController.setResolutionAndFrameRate(resolution: resolution, fps: fps)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }`;
        content = content.replace(originalBlock, replacementBlock);
      }
    }
  }

  fs.writeFileSync(pluginPath, content, 'utf8');
  console.log('Successfully patched CameraPreviewPlugin.swift');
} else {
  console.error('CameraPreviewPlugin.swift not found at', pluginPath);
}

// 3. Patch CameraPreview.java on Android
if (fs.existsSync(androidPath)) {
  let content = fs.readFileSync(androidPath, 'utf8');

  // Add setResolutionAndFrameRate method if not already present
  if (!content.includes('public void setResolutionAndFrameRate(')) {
    const target = 'public void stopRecordVideo(PluginCall call) {';
    const method = `    @PluginMethod
    public void setResolutionAndFrameRate(PluginCall call) {
        call.resolve();
    }\n\n    ${target}`;
    content = content.replace(target, method);
  }

  fs.writeFileSync(androidPath, content, 'utf8');
  console.log('Successfully patched CameraPreview.java');
} else {
  console.error('CameraPreview.java not found at', androidPath);
}
