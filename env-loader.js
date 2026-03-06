/**
 * 環境變量加載器
 * 用於在開發環境中從 .env.local 或 .env 文件讀取環境變量
 * 在生產環境中，密鑰應通過部署配置（Vercel Secrets、Netlify Env vars 等）注入
 */

class EnvLoader {
    constructor() {
        this.env = {};
        this.isLoaded = false;
        this.loadMode = 'client'; // 'client' 或 'server'
    }

    /**
     * 在客戶端環境加載環境變量
     * 僅在開發服務器通過 API 端點提供時有效
     */
    async loadFromServer(endpoint = '/api/env') {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                this.env = await response.json();
                this.isLoaded = true;
                this.loadMode = 'server';
                console.log('[EnvLoader] 環境變量已從服務器加載');
                return true;
            }
        } catch (error) {
            console.warn('[EnvLoader] 無法從服務器加載環境變量:', error.message);
        }
        return false;
    }

    /**
     * 設置環境變量（用於手動配置或測試）
     */
    setEnv(key, value) {
        this.env[key] = value;
    }

    /**
     * 批量設置環境變量
     */
    setEnvBatch(envObject) {
        Object.assign(this.env, envObject);
        this.isLoaded = true;
    }

    /**
     * 獲取環境變量值
     */
    get(key, defaultValue = null) {
        return this.env[key] !== undefined ? this.env[key] : defaultValue;
    }

    /**
     * 獲取所有環境變量（用於調試，不返回敏感信息）
     */
    getAll(maskSecrets = true) {
        if (!maskSecrets) {
            return { ...this.env };
        }

        const masked = {};
        const secretKeys = [
            'AZURE_SPEECH_KEY',
            'GEMINI_API_KEY',
            'API_SECRET',
            'PASSWORD'
        ];

        for (const [key, value] of Object.entries(this.env)) {
            if (secretKeys.some(secret => key.toUpperCase().includes(secret))) {
                masked[key] = value ? '***' + value.slice(-4) : null;
            } else {
                masked[key] = value;
            }
        }

        return masked;
    }

    /**
     * 驗證必需的環境變量
     */
    validate(requiredKeys) {
        const missing = requiredKeys.filter(key => !this.env[key]);

        if (missing.length > 0) {
            console.error('[EnvLoader] 缺失必需的環境變量:', missing);
            return false;
        }

        return true;
    }

    /**
     * 初始化環境變量 - 嘗試多個加載方式
     */
    async initialize() {
        // 1. 首先嘗試從全局 window.ENV 對象讀取（由服務器注入）
        if (typeof window !== 'undefined' && window.ENV) {
            this.setEnvBatch(window.ENV);
            console.log('[EnvLoader] 環境變量已從 window.ENV 加載');
            return true;
        }

        // 2. 嘗試從服務器 API 端點讀取
        const loaded = await this.loadFromServer();
        if (loaded) {
            return true;
        }

        // 3. 如果兩種方式都失敗，使用空配置
        console.warn('[EnvLoader] 未能加載環境變量，轉為手動配置模式');
        return false;
    }

    /**
     * 打印加載狀態（用於調試）
     */
    printStatus() {
        console.group('[EnvLoader] 狀態信息');
        console.log('加載模式:', this.loadMode);
        console.log('是否已加載:', this.isLoaded);
        console.log('可用環境變量:', Object.keys(this.env));
        console.log('配置詳情:', this.getAll(true)); // 掩蓋敏感信息
        console.groupEnd();
    }
}

// 全局實例
window.envLoader = new EnvLoader();

// 自動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.envLoader.initialize();
    });
} else {
    window.envLoader.initialize();
}

// 導出以支持模塊系統
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvLoader;
}
