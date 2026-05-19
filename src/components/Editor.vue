<template>
  <div class="editor-container">
    <div class="editor-glass-wrapper">
      <textarea
        v-model="settings.script"
        placeholder="Paste or write your script here..."
        class="script-editor"
      ></textarea>
    </div>
    <footer class="editor-footer">
      <span class="app-version">Teleprompter v1.0.0</span>
      <div class="footer-links">
        <button @click="openAbout" class="footer-link">About</button>
        <span class="footer-sep">·</span>
        <button @click="openPrivacy" class="footer-link">Privacy Policy</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const { settings } = inject('settings')
const showPrivacy = inject('showPrivacy')
const showAbout = inject('showAbout')

const openPrivacy = () => {
  showPrivacy.value = true
}

const openAbout = () => {
  showAbout.value = true
}
</script>

<style scoped>
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.editor-glass-wrapper {
  flex: 1;
  display: flex;
  background: rgba(20, 20, 22, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.editor-glass-wrapper:focus-within {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.script-editor {
  flex: 1;
  background: transparent;
  color: #f4f4f5;
  border: none;
  border-radius: 16px;
  padding: 24px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1.25rem;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.script-editor::placeholder {
  color: #52525b;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 0 8px;
  font-size: 0.85rem;
}

.app-version {
  color: #52525b;
}

.footer-link {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #a1a1aa;
  text-decoration: underline;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-sep {
  color: #52525b;
  font-size: 0.85rem;
  user-select: none;
}

@media (max-width: 768px) {
  .editor-container {
    padding: 16px;
  }
  .script-editor {
    font-size: 1.1rem;
    padding: 16px;
  }
  .editor-footer {
    margin-top: 12px;
    padding: 0 4px;
  }
}
</style>
