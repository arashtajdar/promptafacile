<template>
  <div class="about-container">
    <div class="about-card">
      <header class="about-header">
        <button @click="close" class="back-btn">
          <ArrowLeft :size="16" />
          <span>Back to Editor</span>
        </button>
        <div class="title-group">
          <div class="app-icon-glow">
            <MonitorPlay class="app-icon" :size="36" />
          </div>
          <div>
            <h1>PromptaFacile</h1>
            <span class="version-badge">v1.0.0</span>
          </div>
        </div>
        <p class="subtitle">A modern, privacy-first teleprompter for creators.</p>
        <p class="subtitle">👑 Javid Shah 👑</p>
      </header>

      <div class="about-content">
        <section class="about-section">
          <div class="section-icon-wrapper info-glow">
            <Info :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>What is PromptaFacile?</h2>
            <p>
              PromptaFacile is a <strong>free, open-source teleprompter</strong> built for content creators,
              speakers, and presenters. It runs entirely in your browser or as a native app on iOS and Android
              — no sign-up, no cloud, no strings attached.
            </p>
          </div>
        </section>
        <section class="about-section">
          <div class="section-icon-wrapper keyboard-glow">
            <Keyboard :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>Keyboard Shortcuts</h2>
            <div class="shortcut-grid">
              <div class="shortcut-item">
                <kbd>Space</kbd>
                <span>Play / Pause</span>
              </div>
              <div class="shortcut-item">
                <kbd>R</kbd>
                <span>Reset scroll</span>
              </div>
              <div class="shortcut-item">
                <kbd>↑</kbd> <kbd>↓</kbd>
                <span>Adjust speed</span>
              </div>
              <div class="shortcut-item">
                <kbd>+</kbd> <kbd>−</kbd>
                <span>Font size</span>
              </div>
              <div class="shortcut-item">
                <kbd>M</kbd>
                <span>Toggle mirror</span>
              </div>
              <div class="shortcut-item">
                <kbd>F</kbd>
                <span>Fullscreen</span>
              </div>
            </div>
          </div>
        </section>

        <section class="about-section">
          <div class="section-icon-wrapper features-glow">
            <Sparkles :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>Features</h2>
            <ul class="feature-list">
              <li><strong>Smooth auto-scrolling</strong> with adjustable speed</li>
              <li><strong>Camera overlay</strong> — read while looking at the lens</li>
              <li><strong>Video recording</strong> with audio in HD/4K</li>
              <li><strong>Mirror mode</strong> for beam-splitter setups</li>
              <li><strong>Customizable</strong> font size, line height &amp; speed</li>
              <li><strong>Keyboard shortcuts</strong> for hands-free control</li>
              <li><strong>100% offline</strong> — works without internet after install</li>
            </ul>
          </div>
        </section>



        <section class="about-section">
          <div class="section-icon-wrapper credit-glow">
            <Heart :size="20" class="section-icon" />
          </div>
          <div class="section-text">
            <h2>Credits</h2>
            <p>
              Built with <strong>Vue.js</strong>, <strong>Capacitor</strong>, and
              <strong>Lucide Icons</strong>. Designed and developed with ❤️ for the creator community.
            </p>
            <p class="contact-line">
              Questions or feedback? Reach out via the app store listing or GitHub.
            </p>
          </div>
        </section>
      </div>

      <footer class="about-card-footer">
        <p>© 2026 PromptaFacile. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { ArrowLeft, MonitorPlay, Info, Sparkles, Keyboard, Heart } from 'lucide-vue-next'

const showAbout = inject('showAbout')

const close = () => {
  showAbout.value = false
}
</script>

<style scoped>
.about-container {
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

.about-card {
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

.about-header {
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

.app-icon-glow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
}

.app-icon {
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.2));
}

.about-header h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.version-badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #60a5fa;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.subtitle {
  color: #71717a;
  font-size: 1.1rem;
  margin: 4px 0 0 0;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

.about-section {
  display: flex;
  gap: 18px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.about-section:hover {
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

.info-glow {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.features-glow {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.keyboard-glow {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.credit-glow {
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

.contact-line {
  margin-top: 10px !important;
  font-size: 0.85rem !important;
  color: #71717a !important;
}

/* Feature list */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-list li {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #a1a1aa;
  position: relative;
  padding-left: 20px;
}

.feature-list li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: #c084fc;
  font-size: 0.7rem;
  top: 4px;
}

.feature-list li strong {
  color: #f4f4f5;
}

/* Keyboard shortcuts */
.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #a1a1aa;
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 26px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  color: #e4e4e7;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.about-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 24px;
  color: #52525b;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 768px) {
  .about-container {
    padding: 24px 16px;
  }

  .about-card {
    padding: 24px;
    border-radius: 20px;
  }

  .about-header h1 {
    font-size: 1.75rem;
  }

  .about-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .about-section {
    padding: 20px;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>
