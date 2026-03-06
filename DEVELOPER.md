# 🛠️ 課堂膠囊 - 開發者指南

本文檔面向想要理解或修改課堂膠囊源碼的開發者。

## 📊 架構概述

```
┌─────────────────────────────────────────────────────────┐
│                    用戶界面 (UI)                          │
│              index.html + styles.css                    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                  應用邏輯 (app.js)                       │
│          協調所有組件和用戶交互                           │
└────────┬────────────────────────┬───────────────────────┘
         │                        │
    ┌────▼──────────┐    ┌───────▼──────────┐
    │  配置管理      │    │  語音識別        │
    │ (config.js)   │    │(azure-speech.js) │
    │               │    │                  │
    │ • 密鑰存儲    │    │ • 流式識別       │
    │ • 本地加密    │    │ • 連續識別       │
    │ • 驗證功能    │    │ • 音頻處理       │
    └───────────────┘    └──────────────────┘
    
    ┌────────────────────────────────────────┐
    │      摘要生成 (gemini-integration.js) │
    │                                        │
    │ • Prompt 工程                          │
    │ • API 調用                             │
    │ • Markdown 導出                        │
    └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              外部 API                                    │
│  Azure Speech Service  │  Google Gemini API             │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ 文件說明

### `index.html`
主頁面結構，包含：
- **設定面板 (#configPanel)**: API 密鑰輸入
- **錄音控制面板 (#recordingPanel)**: 開始/停止錄音
- **轉錄面板 (#transcriptPanel)**: 實時轉錄顯示
- **摘要面板 (#summaryPanel)**: 頻要生成和顯示
- **模態對話框**: 幫助和錯誤提示

### `styles.css`
- 使用 CSS 變量 (custom properties) 管理顏色
- 網格布局和響應式設計
- 動畫和過渡效果
- 品牌色: 紫色漸變 (#667eea → #764ba2)

### `config.js` - 配置管理器
```javascript
// API
window.configManager = new ConfigManager()

// 主要方法
configManager.setKey(keyName, value)      // 保存密鑰
configManager.getKey(keyName)             // 讀取密鑰
configManager.hasKey(keyName)             // 檢查是否存在
configManager.removeKey(keyName)          // 移除單個密鑰
configManager.clearAllKeys()              // 清除所有密鑰
configManager.getStatus()                 // 獲取配置狀態
```

**特性**:
- 使用 localStorage 存儲
- Base64 編碼（簡單混淆，非加密）
- 支持密鑰驗證

### `azure-speech.js` - Azure Speech 服務
```javascript
// API
window.azureSpeechService = new AzureSpeechService()

// 主要方法
azureSpeechService.startRecognition()     // 啟動識別
azureSpeechService.stopRecognition()      // 停止識別
azureSpeechService.getTranscript()        // 獲取轉錄文本
azureSpeechService.getStats()             // 獲取統計信息
azureSpeechService.reset()                // 重置識別器
```

**回調函數**:
```javascript
azureSpeechService.onTranscriptUpdate = (transcript, sentenceCount) => {
    // 轉錄更新時調用
}

azureSpeechService.onStatusChange = (status, statusClass) => {
    // 狀態變化時調用
}

azureSpeechService.onRecognitionEnd = (transcript) => {
    // 識別完成時調用
}

azureSpeechService.onError = (error) => {
    // 錯誤發生時調用
}
```

**實現細節**:
- 使用 Web Audio API 捕獲音頻
- 每 2 秒發送一次音頻數據給 Azure
- 轉換為 16-bit PCM 格式
- 實現了連接重試機制（最多 5 次）
- 語言設置: `zh-CN` (簡體中文)

### `gemini-integration.js` - Gemini 服務
```javascript
// API
window.geminiService = new GeminiService()

// 主要方法
geminiService.generateSummary(transcript, style, length, useProModel)
geminiService.toMarkdown(summary, title)
geminiService.downloadAsMarkdown(summary, filename)
geminiService.validateApiKey(apiKey)
```

**摘要風格**:
- `'structured'`: 結構化筆記（含主題、概念、重點等）
- `'bullet'`: 重點列表
- `'qa'`: 問答形式
- `'mindmap'`: 思維導圖

**摘要長度**:
- `'short'`: ~500 字，max_tokens=1000
- `'medium'`: ~1000 字，max_tokens=2000
- `'long'`: ~2000 字，max_tokens=4000

**回調函數**:
```javascript
geminiService.onProgress = (message) => {
    // 進度消息
}

geminiService.onComplete = (summary) => {
    // 完成時調用
}

geminiService.onError = (error) => {
    // 錯誤處理
}
```

### `app.js` - 主應用邏輯
`ClassroomCapsuleApp` 類協調所有組件：

**主要職責**:
1. 初始化事件監聽器
2. 管理 UI 狀態
3. 協調 Azure 和 Gemini API
4. 處理用戶輸入
5. 管理計時器和進度

**關鍵方法**:
```javascript
app.startRecording()          // 開始錄音
app.stopRecording()           // 停止錄音
app.generateSummary()         // 生成摘要
app.saveKeys()                // 保存 API 密鑰
app.clearKeys()               // 清除密鑰
app.downloadTranscript()      // 下載轉錄
app.downloadSummary()         // 下載摘要
```

## 🔄 工作流程

### 1. 用戶初始化
```
用戶進入頁面
   ↓
app.loadSavedKeys() - 加載本地密鑰狀態
   ↓
updateButtonStates() - 根據密鑰狀態啟用/禁用按鈕
```

### 2. 設置 API 密鑰
```
用戶輸入密鑰
   ↓
app.saveKeys()
   ↓
configManager.setKey('azureKey', value)
configManager.setKey('geminiKey', value)
   ↓
localStorage 存儲（Base64 編碼）
   ↓
更新 UI 狀態：啟用「開始錄音」按鈕
```

### 3. 錄音流程
```
用戶點擊「開始錄音」
   ↓
app.startRecording()
   ↓
azureSpeechService.startRecognition()
   ↓
請求麥克風權限
   ↓
初始化 AudioContext 和音頻處理器
   ↓
啟動循環：每 2 秒采樣音頻
   ↓
HTTP POST 到 Azure API（PCM 格式）
   ↓
接收 DisplayText（完整句子）
   ↓
onTranscriptUpdate 【更新轉錄文本】
   ↓
用戶點擊「停止錄音」
   ↓
停止音頻捕獲，清理資源
   ↓
保存最終轉錄文本
```

### 4. 摘要生成流程
```
用戶點擊「生成摘要」
   ↓
app.generateSummary()
   ↓
validateKeys() - 檢查 API 密鑰
   ↓
獲取轉錄文本
   ↓
geminiService.generateSummary(transcript, style, length)
   ↓
_buildPrompt() - 生成結構化提示詞
   ↓
HTTP POST 到 Gemini API
   ↓
showProgress(true) - 顯示進度指示
   ↓
等待 API 響應（通常 10-30 秒）
   ↓
displaySummary(summary) - 顯示摘要結果
   ↓
showProgress(false)
```

## 🔧 自定義和擴展

### 修改摘要風格

編輯 `gemini-integration.js` 中的 `_buildPrompt()` 方法：

```javascript
case 'your-style':
    styleGuide = '您的風格描述';
    styleFormat = '您的格式要求';
    break;
```

然後在 `index.html` 中添加選項：
```html
<option value="your-style">🎨 您的風格</option>
```

### 修改語言設置

編輯 `azure-speech.js` 中的語言設置：

```javascript
this.language = 'en-US';  // 改為英文
// 完整列表見 Azure 文檔
```

### 添加新 API

例如添加文本轉語音（TTS）功能：

1. 創建新文件 `tts-integration.js`
2. 實現 `TextToSpeechService` 類
3. 在 `index.html` 中導入腳本
4. 在 `app.js` 中添加事件處理

```javascript
window.ttsService = new TextToSpeechService();

// 在 app.js
document.getElementById('speakBtn').addEventListener('click', () => {
    const text = window.azureSpeechService.getTranscript();
    window.ttsService.speak(text);
});
```

### 優化音頻識別

在 `azure-speech.js` 中調整音頻配置：

```javascript
audio: {
    echoCancellation: true,      // 回音消除
    noiseSuppression: true,      // 噪音抑制
    autoGainControl: true,       // 自動增益控制
    sampleRate: 16000            // 採樣率（Azure 推薦）
}
```

## 🧪 測試

### 單元測試建議

在 `config.js` 測試 localStorage：
```javascript
// 測試密鑰保存和讀取
configManager.setKey('test', 'value');
assert(configManager.getKey('test') === 'value');
configManager.removeKey('test');
assert(configManager.getKey('test') === null);
```

### 集成測試建議

1. 測試密鑰設置流程
2. 測試錄音開始/停止
3. 測試 API 調用失敗時的重試邏輯
4. 測試長時間錄音（> 30 分鐘）

### 手動測試清單

- [ ] 瀏覽器無麥克風時的錯誤處理
- [ ] 無效 API 密鑰的錯誤提示
- [ ] 網絡中斷時的重連機制
- [ ] 2 小時長課程的連續識別
- [ ] 摘要導出為 Markdown
- [ ] 響應式設計（手機/平板/桌面）
- [ ] 不同瀏覽器兼容性

## 📊 性能最佳實踐

### 減少 API 調用

```javascript
// ✗ 不好: 每 1 秒調用一次
for (let i = 0; i < audioBuffer.length; i += 16000) {
    recognizeAudio(audioBuffer.slice(i, i + 16000));
}

// ✓ 好: 每 2 秒調用一次，批量發送
if (currentTime - lastRequestTime > 2000 && audioBuffer.length > 0) {
    recognizeAudio(new Uint8Array(audioBuffer));
}
```

### 內存管理

```javascript
// 清理大數組
audioBuffer = [];  // 發送後清空

// 及時停止音頻流
stream.getTracks().forEach(track => track.stop());

// 關閉 AudioContext
await audioContext.close();
```

## 🐛 調試技巧

### 啟用控制台日誌

在 `azure-speech.js` 中：
```javascript
console.log('識別請求失敗:', error);  // 已有
// 添加更多日誌
console.log('發送音頻數據:', audioBuffer.length, '字節');
```

### 檢查 API 響應

```javascript
// 在瀏覽器開發者工具中
// Network 標簽檢查：
// - 請求頭: Ocp-Apim-Subscription-Key
// - 響應: RecognitionStatus, DisplayText
```

### localStorage 檢查

```javascript
// 在控制台運行
localStorage.getItem('classcapsule_azureKey')
localStorage.getItem('classcapsule_geminiKey')
```

## 📚 相關資源

- [Azure Speech Service 文檔](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Google Gemini API 文檔](https://ai.google.dev/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- **[環境變量管理 (ENV.md)](ENV.md)** - 詳細的密鑰管理指南

## 🤝 貢獻指南

提交 PR 時請確保：
1. 代碼遵循現有風格
2. 添加必要的註釋
3. 更新 README 文檔
4. 測試各種瀏覽器兼容性

---

**更新時間**: 2026-03-06
