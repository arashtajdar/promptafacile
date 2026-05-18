# How to Build and Deploy Your iOS App Directly from Windows

Since Apple strictly requires a **macOS environment and Xcode** to compile and code-sign native iOS binaries (`.ipa`), you cannot build the app *locally* on your Windows machine. 

However, you can easily **outsource the macOS compilation step to the cloud**! This allows you to develop entirely on Windows and get a fully functional iOS app installed on your iPhone.

Below are the **three best ways** to build your Capacitor iOS app from a Windows PC.

---

## Option 1: Codemagic (Easiest & Highly Recommended)
[Codemagic](https://codemagic.io) is a dedicated cloud CI/CD platform designed specifically for building mobile apps. They have a generous **free tier** that gives you 500 free build minutes per month on macOS machines.

### Step-by-Step Setup:
1. **Sign Up**: Go to [Codemagic](https://codemagic.io) and log in using your GitHub account.
2. **Add Application**: Select your repository `arashtajdar/promptafacile`.
3. **Configure the Build**:
   * **Project Type**: Select **Capacitor Application** (or Web / Custom).
   * **Build Platform**: Choose **iOS**.
   * **Build Trigger**: Enable "Build on Push" so a new iOS build is compiled every time you push code to `main`.
4. **Environment Configuration**:
   * Set **Node.js version** to matching your local environment (e.g., `18` or `20`).
   * Set **Xcode version** to the latest stable release.
5. **Code Signing** (Required to install on a physical iPhone):
   * Under the **Distribution** or **iOS Code Signing** tab, connect your Apple Developer Account.
   * Codemagic can automatically fetch your **App Store Connect API Key** and generate the necessary certificates and provisioning profiles for you.
6. **Trigger Build**: Click **Start New Build**.
7. **Install on Phone**: Once the build finishes, Codemagic will email you a download link or display a **QR Code**. Simply scan the QR code with your iPhone to install the app over the air (OTA)!

---

## Option 2: GitHub Actions (100% Free & Fully Automated)
Since your repository is hosted on GitHub, you can use **GitHub Actions** to compile your iOS app on GitHub's cloud macOS servers for free!

I have designed a fully automated workflow that you can use.

### Step-by-Step Setup:
1. Create a new directory in your project: `.github/workflows/`
2. Create a new file inside it named `ios-build.yml` (e.g., `c:\Projects\tp\teleprompter\.github\workflows\ios-build.yml`).
3. Paste the following configuration:

```yaml
name: Build iOS App

on:
  push:
    branches: [ main ]
  workflow_dispatch: # Allows manual trigger from the GitHub web UI

jobs:
  build-ios:
    name: Build iOS Native App
    runs-on: macos-14
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: teleprompter/package-lock.json

      - name: Install Project Dependencies
        run: |
          cd teleprompter
          npm ci

      - name: Compile Vue Web App
        run: |
          cd teleprompter
          npm run build

      - name: Sync iOS Native Assets
        run: |
          cd teleprompter
          npx cap sync ios

      - name: Setup CocoaPods
        run: |
          cd teleprompter/ios/App
          pod install

      # NOTE: For physical iPhone testing, code-signing is required.
      # This step compiles an unsigned simulator build (.app) to verify Xcode compiles cleanly.
      - name: Build Xcode Project (Unsigned)
        run: |
          xcodebuild -workspace teleprompter/ios/App/App.xcworkspace \
                     -scheme App \
                     -configuration Release \
                     -sdk iphonesimulator \
                     CODE_SIGNING_ALLOWED=NO \
                     clean build
```

4. **Code Signing on GitHub Actions (Optional but needed for .ipa production)**:
   * To build an actual `.ipa` file that runs on physical iPhones, you need to add your Apple Distribution Certificate (`.p12`) and Provisioning Profile (`.mobileprovision`) to your **GitHub Repository Secrets**.
   * You can use action steps like `Apple-Actions/import-codesign-certs` to sign the app automatically during the build.

---

## Option 3: Rent a Cloud Mac (Mac-in-the-Cloud)
If you want to interact directly with macOS, run simulator devices on your screen, and manually configure Xcode settings without buying a Mac, you can rent a remote Mac.

### Popular Providers:
* **[MacInCloud](https://www.macincloud.com/)**: Starts at ~$20/month. They give you a remote desktop login (RDP/VNC) to a fully configured Mac with Xcode pre-installed.
* **[MacStadium](https://www.macstadium.com/)**: Enterprise-grade cloud Mac hosting.
* **AWS EC2 Mac Instances**: Cloud Macs hosted on Amazon Web Services (billed by the hour, best for short dev sessions).

### How It Works:
1. Sign up for a provider and log in via your Windows Remote Desktop Client.
2. Clone your git repository on the remote Mac.
3. Open Xcode, connect your iPhone via a virtual USB link (or build a TestFlight archive), and run/distribute the app as if you had a physical Mac sitting on your desk!

---

## How to Install the Compiled App on Your iPhone

Once a cloud builder (like Codemagic or GitHub Actions) outputs your `.ipa` (iOS app installation package) or `.app` file:

### 1. Apple TestFlight (Official & Best)
If you have a developer account:
1. Configure your cloud build to upload the build directly to **App Store Connect**.
2. Install the **TestFlight** app on your iPhone.
3. Invite your email address as an external tester, and you can download/update the app instantly on your phone with a single tap.

### 2. Over-the-Air (OTA) Deployments
If you have an Ad-Hoc provisioned `.ipa` file (signed with your developer cert and device UDID):
1. Upload the `.ipa` to a service like **[Diawi](https://www.diawi.com/)** or **[InstallOnAir](https://www.installonair.com/)**.
2. Scan the generated QR code with your iPhone to install it immediately.

### 3. AltStore / SideStore (No Developer Account Required)
If you do not want to buy an Apple Developer account ($99/year), you can "sideload" the unsigned `.ipa` build:
1. Download **[AltStore](https://altstore.io/)** on your Windows PC.
2. Connect your iPhone to your Windows PC via USB.
3. Install AltStore onto your phone.
4. Transfer your custom iOS `.ipa` file to your phone, open AltStore on your phone, and install the app (it signs it locally using your personal Apple ID!).
