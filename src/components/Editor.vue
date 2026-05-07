<template>
  <div class="editor-container">
    <div class="editor-glass-wrapper">
      <textarea
        v-model="settings.script"
        placeholder="Paste or write your script here..."
        class="script-editor"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const { settings } = inject('settings')
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

@media (max-width: 768px) {
  .editor-container {
    padding: 16px;
  }
  .script-editor {
    font-size: 1.1rem;
    padding: 16px;
  }
}
</style>
