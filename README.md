# 📚 課堂膠囊 (Class Capsule) v1.0

> 純網頁端課堂助手 - 實時語音轉錄 + AI 智慧筆記生成

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()

## 🎯 核心功能

### ✨ 主要特性

- **🎙️ 即時語音轉錄**
  - Azure Speech Service 實時流式識別
  - 支持連續識別 (Continuous Recognition) - 不中斷 2 小時課程
  - 中文優化識別，支持資訊工程專有術語
  - 無損轉字精確度

- **🤖 AI 智慧摘要**
  - Google Gemini 1.5 Flash/Pro API 整合
  - 多種摘要風格：結構化筆記、重點列表、問答形式、思維導圖
  - 靈活的摘要長度選項（簡短/中等/詳細）
  - 自動 Markdown 格式化輸出

- **🔐 BYOK (Bring Your Own Key)**
  - 用戶提供自有的 Azure japaneast Key 和 Gemini API 密鑰
  - 密鑰本地安全存儲，不上傳任何服務器
  - 支持密鑰更新和清除

- **💻 純網頁端部署**
  - 無需安裝客戶端應用
  - 支持 Vercel、Netlify 等一鍵部署
  - 離線後仍可查看之前的轉錄和摘要
  - 響應式設計，支持桌面和移動設備

## 🛠️ 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| **前端** | HTML5 + CSS3 + Vanilla JS | 無依賴，輕量級 |
| **語音轉錄** | Azure Cognitive Services (Speech) | 支持 japaneast 區域 |
| **AI 摘要** | Google Gemini API | 使用 1.5 Flash/Pro 模型 |
| **音頻處理** | Web Audio API | 實時錄音和音頻流處理 |
| **數據存儲** | localStorage | 本地存儲 API 密鑰 |

## 📋 系統需求

### 必需
- **瀏覽器**: Chrome/Edge/Firefox/Safari (最新版本)
- **麥克風**: 支持麥克風輸入的設備
- **網絡**: 穩定的網絡連接（用於 API 調用）

### API 密鑰
- **Azure Speech Service**: japaneast 區域的 Standard Tier 密鑰
- **Google Gemini API**: Google AI Studio 獲取的 API 密鑰

## 🚀 快速開始

### 1️⃣ 本地運行

```bash
# 克隆倉庫
git clone https://github.com/yourusername/class-capsule-v2.git
cd class-capsule-v2

# 使用簡單的 HTTP 服務器運行
# Python 3
python -m http.server 8000

# 或使用 Node.js (如已安裝)
npx http-server

# 或使用 PHP
php -S localhost:8000
```

然後在瀏覽器中訪問: `http://localhost:8000`

### 2️⃣ 在線部署

#### 部署到 Vercel (推薦)

1. Fork 本倉庫到您的 GitHub 帳戶
2. 訪問 [Vercel](https://vercel.com) 並登錄
3. 點擊 "New Project"，選擇您 fork 的倉庫
4. 點擊 "Deploy"
5. 應用將在 Vercel 上自動部署

```
部署 URL: https://class-capsule-v2.vercel.app
```

#### 部署到 Netlify

1. Fork 本倉庫
2. 訪問 [Netlify](https://www.netlify.com)
3. 點擊 "New site from Git"
4. 連接您的 GitHub 帳戶並選擇倉庫
5. 點擊 "Deploy site"

#### 部署到 GitHub Pages

```bash
# 推送到 main 分支
git push origin main

# 在倉庫設置中啟用 GitHub Pages
# 設置 Source 為 "main branch"
```

### 3️⃣ 初次使用

1. **設置 API 密鑰**
   - 打開應用首頁
   - 在「⚙️ 設定您的 API 密鑰」區域輸入：
     - Azure Speech API 密鑰（japaneast 區域）
     - Gemini API 密鑰
   - 點擊「💾 保存設定」

2. **開始錄音**
   - 點擊「⏺️ 開始錄音」
   - 允許瀏覽器訪問麥克風
   - 邊講邊轉錄，文本實時顯示

3. **生成摘要**
   - 錄音完成後，選擇摘要風格和長度
   - 點擊「🤖 生成 Gemini AI 摘要」
   - 等待 AI 生成結構化筆記

4. **導出結果**
   - 複製轉錄文本或摘要
   - 下載為 TXT（轉錄）或 Markdown（摘要）格式

## 🔑 API 密鑰管理

> 👉 **詳細環境變量和密鑰管理方式見 [ENV.md](ENV.md)**

支持多種安全方式管理 API 密鑰：
- ✅ **推薦**: 使用 `.env.local` 文件（本地開發）+ Node.js 服務器
- ✅ 部署平台密鑰管理（Vercel Secrets、Netlify Env vars）
- ✅ 瀏覽器 localStorage（快速測試）

### Azure Speech Service 密鑰

1. 訪問 [Microsoft Azure Portal](https://portal.azure.com)
2. 創建新資源 → 搜索「Speech」
3. 創建 Speech 資源：
   - **訂閱**: 選擇您的訂閱
   - **資源組**: 創建新組或選擇現有
   - **區域**: `japaneast` (日本東部)
   - **定價層**: `Standard`（不支持 Free tier）
4. 創建後，進入資源
5. 在「密鑰和端點」部分複製 **Key1** 或 **Key2**

### Gemini API 密鑰

1. 訪問 [Google AI Studio](https://aistudio.google.com)
2. 點擊「Get API Key」
3. 若無 Google 帳戶，先登錄或創建
4. 點擊「Create API Key in new project」或選擇現有項目
5. 複製生成的 API 密鑰
6. **重要**: 保護好您的密鑰，不要在公開代碼中暴露

## 📖 使用指南

### 錄音技巧

- **麥克風設置**: 確保使用質量較好的麥克風以提高識別準確度
- **環境噪音**: 盡量在安靜的環境中進行
- **網絡連接**: 保持穩定的互聯網連接
- **長時間錄音**: 系統支持 2+ 小時連續識別，超過時間可點擊「停止」後重新開始

### 摘要生成

**摘要風格:**
- **📊 結構化筆記** (推薦): 包含主題、核心概念、重點、術語定義、應用等
- **🔹 重點列表**: 以要點形式展示關鍵信息
- **❓ 問答形式**: 列出課程內容中的關鍵問題和答案
- **🔗 思維導圖**: 展示概念之間的層級關係

**摘要長度:**
- **簡短**: ~500 字，適合快速復習
- **中等**: ~1000 字，平衡詳細度和簡潔性（推薦）
- **詳細**: ~2000 字，包含詳細細節和示例

### 數據導出

**轉錄文本** (TXT 格式)
- 逐字複製課堂講話
- 便于進一步編輯或保存

**摘要** (Markdown 格式)
- 結構化的筆記格式
- 支援在 VSCode、Notion、Obsidian 等工具中使用
- 可直接發佈到博客或筆記應用

## 🔒 隱私和安全

### 密鑰管理
- ✅ API 密鑰僅存儲在您的瀏覽器本地
- ✅ 不會發送到任何第三方服務器
- ✅ 支持隨時清除密鑰
- ⚠️ 清除瀏覽器數據時，本地存儲的密鑰也會被刪除

### 數據隱私
- 轉錄數據和摘要在您的設備上處理
- 僅在調用 Azure 和 Gemini API 時發送轉錄和轉錄數據
- 遵守 Azure 和 Google 的數據隱私政策

## 🐛 故障排除

### 常見問題

**Q: 「無法啟動識別: NotAllowedError」**
- A: 瀏覽器被禁止訪問麥克風。檢查：
  1. 麥克風連接是否正確
  2. 瀏覽器權限設置
  3. 嘗試在匿名模式下打開

**Q: 「識別失敗」**
- A: 檢查以下事項：
  1. Azure API 密鑰是否正確
  2. 區域是否設置為 `japaneast`
  3. 網絡連接是否穩定
  4. Azure 訂閱是否有效且有配額

**Q: Gemini 摘要生成很慢**
- A: 這可能是由於：
  1. 網絡延遲
  2. API 速率限制
  3. 轉錄文本太長（>10000 字）
  建議分段生成摘要

**Q: 密鑰被清除了**
- A: 這可能發生在以下情況：
  1. 清除瀏覽器數據/緩存時
  2. 使用無痕浏览模式
  3. 長時間未使用瀏覽器自動清除
  解決: 重新輸入並保存密鑰

## 📈 性能指標

| 指標 | 值 |
|------|-----|
| **識別延遲** | ~1-2 秒 |
| **摘要生成時間** | ~10-30 秒（取決於文本長度） |
| **支持的最長錄音時間** | 2+ 小時（連續） |
| **最大轉錄字數** | ~100,000 字 |
| **支持的語言** | 中文、英文等（主要針對中文優化） |

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發指南

```bash
# 開發環境設置
git clone https://github.com/yourusername/class-capsule-v2.git
cd class-capsule-v2

# 啟動本地服務器
python -m http.server 8000

# 修改代碼後刷新瀏覽器查看變化
```

## 📝 文件結構

```
class-capsule-v2/
├── index.html           # 主頁面
├── styles.css           # 樣式表
├── config.js            # 配置和密鑰管理
├── azure-speech.js      # Azure Speech 集成
├── gemini-integration.js # Gemini API 集成
├── app.js               # 主應用邏輯
├── README.md            # 本文件
├── vercel.json          # Vercel 部署配置
└── .gitignore           # Git 忽略文件
```

## 📜 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🙋 問題反饋

- 提交 Issue: [GitHub Issues](https://github.com/yourusername/class-capsule-v2/issues)
- 討論: [GitHub Discussions](https://github.com/yourusername/class-capsule-v2/discussions)

## 🌟 致謝

- Azure Cognitive Services 團隊
- Google Gemini API 文檔
- Web Audio API 社區
- 所有貢獻者

---

**開發者**: [Your Name]  
**最後更新**: 2026-03-06  
**版本**: v1.0

---

## 🔮 未來計劃 (Roadmap)

- [ ] 支持多語言界面
- [ ] 實時摘要預覽
- [ ] 本地音頻存儲
- [ ] 多話題分段
- [ ] 導出為 PDF/DOCX
- [ ] 云同步功能
- [ ] 移動應用版本
- [ ] 語音風格識別
