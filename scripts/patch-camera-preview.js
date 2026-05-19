import fs from 'fs';
import path from 'path';

const controllerPath = path.resolve('node_modules/@capacitor-community/camera-preview/ios/Sources/CameraPreviewPlugin/CameraController.swift');
const pluginPath = path.resolve('node_modules/@capacitor-community/camera-preview/ios/Sources/CameraPreviewPlugin/CameraPreviewPlugin.swift');

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

  // Patch captureVideo and stopRecording methods
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

  // Replace startRecordVideo and stopRecordVideo methods
  const startMethodStart = '@objc func startRecordVideo(_ call: CAPPluginCall) {';
  if (content.includes(startMethodStart)) {
    const startIdx = content.indexOf(startMethodStart);
    // Find the end of stopRecordVideo
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
