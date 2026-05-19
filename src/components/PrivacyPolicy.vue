<template>
  <div class="privacy-container">
    <div class="privacy-card">
      <header class="privacy-header">
        <button @click="close" class="back-btn">
          <ArrowLeft :size="16" />
          <span>Back to Editor</span>
        </button>
        <div class="title-group">
          <div class="shield-glow">
            <ShieldCheck class="shield-icon" :size="36" />
          </div>
          <h1>Privacy Policy</h1>
        </div>
        <p class="subtitle">Simple, transparent, and completely private.</p>
      </header>

      <div class="privacy-content">
        <section class="policy-section">
          <div class="section-icon-wrapper camera-glow">
            <Video :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>Camera & Audio (Local Processing)</h2>
            <p>
              Your camera feed and audio are processed <strong>entirely locally</strong> on your device.
              This application does not upload, stream, transmit, or store any of your video or audio feeds on external servers.
              All video overlay rendering and video recording happen directly in your browser.
            </p>
          </div>
        </section>

        <section class="policy-section">
          <div class="section-icon-wrapper storage-glow">
            <Database :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>Scripts & Settings (Local Storage)</h2>
            <p>
              Any script you type or paste here, along with your preferred settings (speed, font size, mirror mode),
              is saved in your browser's local storage (<code>localStorage</code>).
              This data never leaves your device and is not accessible to anyone else.
            </p>
          </div>
        </section>

        <section class="policy-section">
          <div class="section-icon-wrapper tracking-glow">
            <Lock :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>No Tracking & No Ads</h2>
            <p>
              We do not use tracking cookies, analytics, or show advertising.
              We do not collect any personal information, usage metrics, or sell data to third parties.
              The application functions as a pure utility tool.
            </p>
          </div>
        </section>

        <section class="policy-section">
          <div class="section-icon-wrapper clear-glow">
            <HelpCircle :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>How to Clear Your Data</h2>
            <p>
              You can remove all stored scripts and settings at any time by clearing your browser's cache or local storage,
              or by resetting the application. Since no data is saved on our servers, once cleared, it is gone forever.
            </p>
          </div>
        </section>
      </div>

      <footer class="privacy-card-footer">
        <p>Last updated: May 2026. Designed with security and privacy in mind.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { ArrowLeft, ShieldCheck, Video, Database, Lock, HelpCircle } from 'lucide-vue-next'

const showPrivacy = inject('showPrivacy')

const close = () => {
  showPrivacy.value = false
}
</script>

<style scoped>
.privacy-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 24px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  overflow-y: auto;
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.privacy-card {
  width: 100%;
  background: rgba(20, 20, 22, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.privacy-header {
  margin-bottom: 40px;
  position: relative;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #a1a1aa;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(0);
}

.title-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.shield-glow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
}

.shield-icon {
  filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.2));
}

.privacy-header h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #71717a;
  font-size: 1.1rem;
  margin: 4px 0 0 0;
}

.privacy-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

.policy-section {
  display: flex;
  gap: 18px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.policy-section:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.section-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.camera-glow {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.storage-glow {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.tracking-glow {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.clear-glow {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.section-text h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #f4f4f5;
}

.section-text p {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  color: #a1a1aa;
}

.section-text strong {
  color: #f4f4f5;
}

.section-text code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e4e4e7;
}

.privacy-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 24px;
  color: #52525b;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 768px) {
  .privacy-container {
    padding: 24px 16px;
  }
  
  .privacy-card {
    padding: 24px;
    border-radius: 20px;
  }

  .privacy-header h1 {
    font-size: 1.75rem;
  }

  .privacy-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .policy-section {
    padding: 20px;
  }
}
</style>
