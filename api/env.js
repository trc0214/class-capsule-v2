/**
 * Vercel Serverless Function: /api/env
 * 用於在 Vercel 環境中提供環境變量給客戶端
 * 
 * 使用場景：
 * - .env.local 無法在靜態部署中使用
 * - 需要在客戶端自動加載非敏感配置信息
 * - 支持動態配置（無需重新部署）
 * 
 * 部署:
 * 1. 在 Vercel 上設置環境變量（Project Settings → Environment Variables）
 * 2. 此函數會自動讀取這些變量並返回給客戶端
 * 
 * 安全性:
 * - 僅返回非敏感信息（如 AZURE_SPEECH_REGION、APP_LANGUAGE）
 * - 客戶端密鑰（如 API_KEY）**不通過此端點返回**
 * - 在需要時可配置 CORS 限制
 */

export default function handler(req, res) {
    // CORS 配置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允許 GET 請求
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        // 組建安全的環境變量對象（不包含敏感信息）
        const config = {
            azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'japaneast',
            appLanguage: process.env.APP_LANGUAGE || 'zh-CN',
            debugMode: process.env.DEBUG_MODE === 'true',
            publicUrl: process.env.PUBLIC_URL || process.env.VERCEL_URL,
            environment: process.env.VERCEL_ENV || 'production',
        };

        // 在開發模式返回敏感信息（僅用於開發！）
        if (process.env.DEBUG_MODE === 'true') {
            // ⚠️ 警告：只在開發環境鑰匙敏感信息
            if (process.env.AZURE_SPEECH_KEY) {
                // 不返回完整密鑰，僅返回最後 4 個字符用於驗證
                config.azureKeyVerify = '***' + process.env.AZURE_SPEECH_KEY.slice(-4);
            }
            if (process.env.GEMINI_API_KEY) {
                config.geminiKeyVerify = '***' + process.env.GEMINI_API_KEY.slice(-4);
            }
        }

        res.status(200).json(config);

    } catch (error) {
        console.error('[API] Error loading environment:', error);
        res.status(500).json({
            error: 'Failed to load configuration',
            message: process.env.DEBUG_MODE === 'true' ? error.message : undefined,
        });
    }
}

/**
 * 使用示例：
 * 
 * 在客戶端調用此 API：
 * 
 * fetch('/api/env')
 *   .then(res => res.json())
 *   .then(config => {
 *       console.log('應用配置:', config);
 *       // 如果需要，手動注入到 configManager
 *       if (config.azureSpeechRegion) {
 *           window.configManager.setEnv('azureSpeechRegion', config.azureSpeechRegion);
 *       }
 *   });
 * 
 * Vercel 環境變量設置：
 * 
 * 在 Project Settings → Environment Variables 中添加：
 * 
 * AZURE_SPEECH_KEY = your_actual_key (在構建時使用，不通過 API 發送)
 * GEMINI_API_KEY = your_actual_key (在構建時使用，不通過 API 發送)
 * AZURE_SPEECH_REGION = japaneast
 * APP_LANGUAGE = zh-CN
 * DEBUG_MODE = false (生產環境設為 false！)
 * PUBLIC_URL = https://your-domain.vercel.app
 */
