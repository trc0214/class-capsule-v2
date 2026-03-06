/**
 * 配置管理模擬 - 本地安全存儲 API 密鑰
 * 使用 localStorage 和簡單加密確保安全性
 */

class ConfigManager {
    constructor() {
        this.storagePrefix = 'classcapsule_';
        this.encryptionEnabled = true;
    }

    /**
     * 簡單的 Base64 編碼（注：不是真正的加密，僅用於混淆）
     * 實生產環境應使用真正的加密庫如 TweetNaCl.js
     */
    _encode(text) {
        return btoa(text);
    }

    _decode(text) {
        try {
            return atob(text);
        } catch (e) {
            return text;
        }
    }

    /**
     * 保存 API 密鑰
     */
    setKey(keyName, value) {
        if (!value) {
            this.removeKey(keyName);
            return;
        }

        const storageKey = this.storagePrefix + keyName;
        const encodedValue = this.encryptionEnabled ? this._encode(value) : value;
        
        try {
            localStorage.setItem(storageKey, encodedValue);
            return true;
        } catch (e) {
            console.error(`無法保存 ${keyName}:`, e);
            return false;
        }
    }

    /**
     * 獲取 API 密鑰
     */
    getKey(keyName) {
        const storageKey = this.storagePrefix + keyName;
        
        try {
            const encodedValue = localStorage.getItem(storageKey);
            if (!encodedValue) return null;
            
            return this.encryptionEnabled ? this._decode(encodedValue) : encodedValue;
        } catch (e) {
            console.error(`無法讀取 ${keyName}:`, e);
            return null;
        }
    }

    /**
     * 檢查是否已設定密鑰
     */
    hasKey(keyName) {
        return !!this.getKey(keyName);
    }

    /**
     * 移除單個密鑰
     */
    removeKey(keyName) {
        const storageKey = this.storagePrefix + keyName;
        try {
            localStorage.removeItem(storageKey);
            return true;
        } catch (e) {
            console.error(`無法移除 ${keyName}:`, e);
            return false;
        }
    }

    /**
     * 清除所有密鑰
     */
    clearAllKeys() {
        const keysToRemove = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('無法清除密鑰:', e);
            return false;
        }
    }

    /**
     * 驗證密鑰是否有效格式
     */
    validateAzureKey(key) {
        // Azure Key 通常是 32 個字符的十六進制字符串
        return key && key.length >= 24 && /^[a-zA-Z0-9]+$/.test(key);
    }

    /**
     * 驗證 Gemini API 密鑰格式
     */
    validateGeminiKey(key) {
        // Gemini API 密鑰通常是較長的字符串
        return key && key.length >= 30;
    }

    /**
     * 獲取所有配置的狀態
     */
    getStatus() {
        return {
            azureConfigured: this.hasKey('azureKey'),
            geminiConfigured: this.hasKey('geminiKey'),
        };
    }
}

// 全局配置管理器實例
window.configManager = new ConfigManager();

// 導出以支持模塊系統
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}
