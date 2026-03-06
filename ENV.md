# 🔐 環境變量和密鑰管理

課堂膠囊支持多種安全的方式管理 API 密鑰和敏感配置。

## 📋 目錄

1. [安全模式對比](#安全模式對比)
2. [本地開發](#本地開發)
3. [生產部署](#生產部署)
4. [命令參考](#命令參考)
5. [故障排除](#故障排除)

---

## 🔒 安全模式對比

| 模式 | 環境 | 安全性 | 難度 | 推薦場景 |
|------|------|--------|------|---------|
| **手動輸入** | 所有 | ⭐⭐⭐ | 簡單 | 快速測試、演示 |
| **.env.local + 開發服務器** | 本地開發 | ⭐⭐⭐⭐ | 簡單 | 日常開發 |
| **部署配置** | 生產環境 | ⭐⭐⭐⭐⭐ | 簡單 | 線上部署 |
| **環境變量注入** | CI/CD | ⭐⭐⭐⭐⭐ | 中等 | 自動化部署 |

---

## 💻 本地開發

### 方式 1：使用 .env.local 文件（推薦）

#### 步驟 1：複製模板

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

#### 步驟 2：編輯 .env.local

打開 `.env.local` 文件，填入您的 API 密鑰：

```env
AZURE_SPEECH_KEY=your_actual_azure_key_here
GEMINI_API_KEY=your_actual_gemini_key_here
AZURE_SPEECH_REGION=japaneast
DEBUG_MODE=true
```

#### 步驟 3：啟動開發服務器

**方式 A：使用 Node.js（推薦）**

```bash
# 首先安裝 dotenv（可選，用於自動解析 .env）
npm install dotenv

# 啟動服務器
npm start
# 或
node server.js

# 訪問：http://localhost:8000
```

**方式 B：使用 Python**

```bash
python -m http.server 8000
# 訪問：http://localhost:8000
```

> ⚠️ 警告：使用 Python HTTP 服務器時，.env.local 中的密鑰**不會自動加載**。
> 您必須在 UI 上手動輸入密鑰或使用 Node.js 服務器。

### 方式 2：直接在 UI 上輸入（快速測試）

如果您不想使用 .env 文件：

1. 打開應用
2. 在「⚙️ 設定您的 API 密鑰」面板輸入密鑰
3. 點擊「💾 保存設定」
4. 密鑰會安全存儲在瀏覽器 localStorage

---

## 🚀 生產部署

### Vercel 部署（推薦）

#### 步驟 1：推送代碼

```bash
git push -u origin main
```

#### 步驟 2：在 Vercel 上添加環境變量

1. 訪問 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的項目
3. 進入 **Settings** → **Environment Variables**
4. 添加以下變量：

| 名稱 | 值 |
|------|-----|
| `AZURE_SPEECH_KEY` | 您的 Azure Key |
| `GEMINI_API_KEY` | 您的 Gemini Key |
| `AZURE_SPEECH_REGION` | `japaneast` |

5. 重新部署

#### 步驟 3：注入環境變量到客戶端（可選）

如果需要在生產環境自動加載密鑰，創建 Vercel 函數：

```bash
# 創建目錄
mkdir -p api

# 創建 api/env.js（Vercel serverless function）
```

參考下面的服務方式。

### Netlify 部署

#### 步驟 1：連接倉庫

在 Netlify 上，連接您的 GitHub 倉庫。

#### 步驟 2：添加環境變量

1. 進入 **Site settings** → **Build & deploy** → **Environment**
2. 點擊 **Edit variables**
3. 添加：
   - `AZURE_SPEECH_KEY`
   - `GEMINI_API_KEY`
   - `AZURE_SPEECH_REGION`

4. 重新觸發部署

#### 步驟 3：部署配置（netlify.toml 已包含）

```toml
# netlify.toml 已配置，無需修改
[dev]
  command = "node server.js"
  port = 8000
```

### GitHub Pages 部署

⚠️ **警告**：GitHub Pages 不支持服務器端環境變量。

解決方案：
1. 在 UI 上手動輸入密鑰
2. 或使用 GitHub Secrets + Actions 構建時注入

```yaml
# .github/workflows/deploy.yml 示例
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: git push --force origin main:gh-pages
```

---

## 🛠️ 命令參考

### 開發環境

```bash
# 啟動開發服務器（支持 .env.local 自動加載）
npm start
# 或
node server.js

# 啟動並監控 .env 文件變化
WATCH_ENV=true npm start

# 查看加載的環境變量狀態
curl http://localhost:8000/api/env-status
```

### 使用 Python 服務器（最簡單，但不支持 .env）

```bash
# Python 3
python -m http.server 8000

# 訪問：http://localhost:8000
```

### 使用 Node.js 簡易服務器

```bash
# 需要先安裝
npm install -g http-server

# 運行
npx http-server

# 或全局安裝后
http-server
```

---

## 🌐 API 端點

如果使用 Node.js 服務器，以下端點可用：

### 獲取環境變量

```http
GET /api/env
```

**響應示例：**
```json
{
  "AZURE_SPEECH_REGION": "japaneast",
  "DEBUG_MODE": "true",
  "APP_LANGUAGE": "zh-CN"
}
```

> ⚠️ 注意：API 密鑰僅在 `DEBUG_MODE=true` 時返回，強烈不推薦在生產環境使用此設置。

### 獲取環境變量狀態

```http
GET /api/env-status
```

**響應示例：**
```json
{
  "loaded": true,
  "keys": [
    {
      "name": "AZURE_SPEECH_KEY",
      "set": true,
      "secret": true
    },
    {
      "name": "AZURE_SPEECH_REGION",
      "set": true,
      "secret": false
    }
  ]
}
```

---

## 🔐 安全最佳實踐

### ✅ 推薦做法

1. **開發環境**
   - 使用 `.env.local` 存儲密鑰
   - 將 `.env.local` 添加到 `.gitignore`（已默認配置）
   - 使用 Node.js 開發服務器

2. **生產環境**
   - 使用部署平台的密鑰管理（Vercel Secrets、Netlify Env vars）
   - 不要在代碼中硬編碼密鑰
   - 定期輪換 API 密鑰

3. **共享代碼時**
   - 提供 `.env.example` 模板（已包含）
   - 說明如何配置密鑰
   - 從不上傳包含真實密鑰的 `.env` 或 `.env.local`

### ❌ 避免做法

1. ❌ 將密鑰提交到 Git
2. ❌ 在客戶端 JavaScript 中硬編碼密鑰
3. ❌ 在公開倉庫中暴露 `.env` 文件
4. ❌ 通過 URL 參數傳遞敏感信息
5. ❌ 在瀏覽器控制台記錄敏感信息

---

## 🔧 環境變量清單

### 必需變量

| 變量 | 說明 | 示例 |
|------|------|------|
| `AZURE_SPEECH_KEY` | Azure Speech 密鑰 | `abc123def456...` |
| `GEMINI_API_KEY` | Gemini API 密鑰 | `AIza...` |

### 可選變量

| 變數 | 說明 | 默認值 |
|------|------|--------|
| `AZURE_SPEECH_REGION` | Azure 地區 | `japaneast` |
| `APP_LANGUAGE` | 應用語言 | `zh-CN` |
| `DEBUG_MODE` | 調試模式 | `false` |
| `PUBLIC_URL` | 公開 URL | `http://localhost:8000` |

---

## 🆘 故障排除

### Q: 「無法從環境變量加載」

**A:** 檢查以下事項：

1. 確認您在使用 Node.js 服務器（非 Python）
   ```bash
   node server.js
   ```

2. 檢查 `.env.local` 文件是否存在並有效
   ```bash
   # Windows PowerShell
   Get-Content .env.local
   
   # macOS/Linux
   cat .env.local
   ```

3. 檢查環境變量是否正確格式
   ```env
   # ✓ 正確
   AZURE_SPEECH_KEY=your_key_here
   
   # ✗ 錯誤（含空格）
   AZURE_SPEECH_KEY = your_key_here
   ```

4. 確認密鑰不含引號
   ```env
   # ✓ 正確
   AZURE_SPEECH_KEY=abc123
   
   # ✗ 錯誤
   AZURE_SPEECH_KEY="abc123"
   ```

### Q: 「環境變量已加載，但仍無法連接 API」

**A:** 可能的原因：

1. 密鑰不正確
   - 重新複製密鑰並確保無多餘空格
   
2. Azure 區域不是 japaneast
   ```env
   AZURE_SPEECH_REGION=japaneast  # 必須
   ```

3. 密鑰已過期或無配額
   - 在 Azure 門戶檢查訂閱狀態

### Q: 「密鑰暴露在環境變量狀態 API」

**A:** 這是故意的設計：

1. `/api/env-status` 端點經過設計，**不返回敏感密鑰值**
2. 密鑰只在 `DEBUG_MODE=true` 時發送給客戶端
3. 生產環境應設置 `DEBUG_MODE=false`

### Q: ".env.local 被意外提交到 Git"

**A:** 立即撤銷：

```bash
# 從 Git 歷史中移除（危儀！）
git rm --cached .env.local
git commit -m "Remove .env.local"

# 輪換所有 API 密鑰！
echo "重新生成 Azure 和 Gemini 密鑰"
```

---

## 📚 進階配置

### 為不同環境創建多個 .env 文件

```bash
.env                # 基礎配置（提交到 Git）
.env.local          # 本地開發（.gitignore）
.env.production     # 生產環境（.gitignore）
.env.staging        # 預發布環境（.gitignore）
```

### 在 Node.js 中自動選擇環境

```javascript
// 在 server.js 中
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
}
```

### 通過 GitHub Actions 自動部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: npm run deploy
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          AZURE_SPEECH_KEY: ${{ secrets.AZURE_SPEECH_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

---

## 💡 密鑰輪換指南

### 定期更新密鑰（推薦每 90 天）

1. **在 Azure Portal 中**
   - 訪問 Speech 資源
   - 進入「密鑰和端點」
   - 點擊「重新生成 Key1」或「Key2」

2. **更新您的 .env.local**
   ```env
   AZURE_SPEECH_KEY=new_key_here
   ```

3. **更新部署平台**
   - Vercel: Settings → Environment Variables
   - Netlify: Settings → Environment

4. **驗證連接**
   ```bash
   # 測試新密鑰
   curl http://localhost:8000/api/env-status
   ```

---

## 🔗 相關資源

- [Azure 密鑰管理](https://learn.microsoft.com/azure/cognitive-services/speech-service/how-to-key-management)
- [Google API 安全性](https://cloud.google.com/docs/authentication/security)
- [dotenv 文檔](https://github.com/motdotla/dotenv)
- [Vercel Secrets](https://vercel.com/docs/projects/environment-variables/security)
- [Netlify Build Environment](https://docs.netlify.com/configure-builds/environment/#environment-variables)

---

**版本**: v1.0  
**更新時間**: 2026-03-06  
**狀態**: 生產就緒 ✅
