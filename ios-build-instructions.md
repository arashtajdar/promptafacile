# iOS Build Instructions for Teleprompter

Since you are currently working on a **Windows** machine, there is an important caveat: **Apple requires macOS and Xcode to compile and sign iOS applications.** 

To build the app for your iPhone, iPad, and the App Store, you have two options: transfer the project to a Mac, or use a cloud-build service (like GitHub Actions, Codemagic, or Ionic Appflow).

Assuming you have access to a **Mac**, here is the exact step-by-step process:

### 1. Move the Project to Your Mac
Copy your entire `teleprompter` folder to your Mac (you can ignore the `node_modules` folder to save time). 

### 2. Build and Sync the Web Assets
Open the terminal on your Mac, navigate to the `teleprompter` directory, and run:
```bash
npm install
npm run build
npx cap sync ios
```
*This compiles your Vue app and pushes the web assets into the native iOS project folder.*

### 3. Open Xcode
Run the following command in the terminal to automatically open your project in Xcode:
```bash
npx cap open ios
```

### 4. Configure Your Apple Developer Account
1. In Xcode, look at the left sidebar (Project Navigator) and click on **App** at the very top.
2. In the main window area, select the **App** target and click on the **Signing & Capabilities** tab.
3. Check the box that says **"Automatically manage signing"**.
4. In the **Team** dropdown, log in with your Apple ID and select your Apple Developer Team.
5. *Optional:* Under the **General** tab, you can configure your Display Name, Bundle Identifier (e.g., `com.teleprompter.app`), and App Icon.

### 5. Test on Your Device
1. Connect your iPhone or iPad to your Mac via USB.
2. At the top of the Xcode window, select your physical device from the device dropdown list (next to the play button).
3. Hit the **Play (▶)** button or press `Cmd + R` to compile the app and install it directly onto your device.

### 6. Publish to TestFlight / App Store
Once you are happy with the app and want to distribute it:
1. Change the target device dropdown at the top from your physical device to **"Any iOS Device (arm64)"**.
2. In the top macOS menu bar, go to **Product > Archive**.
3. Once the build finishes, the Xcode Organizer window will pop up. 
4. Click **Distribute App** and follow the prompts to upload it to App Store Connect, where you can release it to TestFlight or submit it for App Store review.
