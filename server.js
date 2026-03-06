/**
 * 開發服務器 - 用於本地開發
 * 支持：
 * 1. 讀取 .env.local 和 .env 文件
 * 2. 提供 API 端點 /api/env 將環境變量發送給客戶端
 * 3. 提供靜態文件服務
 * 4. 自動重新加載環境變量（可選）
 * 
 * 使用方式：
 *   node server.js
 *   訪問：http://localhost:8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 加載 dotenv（可選依賴）
let dotenv = null;
try {
    dotenv = require('dotenv');
} catch (e) {
    console.log('提示：請運行 npm install dotenv 以支持 .env 文件讀取');
    console.log('或者手動設置環境變量');
}

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

class DevServer {
    constructor() {
        this.env = {};
        this.mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        };
        this.loadEnv();
    }

    /**
     * 加載環境變量
     */
    loadEnv() {
        // 方式 1：使用 dotenv 讀取 .env 文件
        if (dotenv) {
            // 優先讀取 .env.local
            if (fs.existsSync('.env.local')) {
                const config = dotenv.parse(fs.readFileSync('.env.local'));
                this.env = { ...this.env, ...config };
                console.log('[DevServer] 已加載 .env.local');
            }

            // 其次讀取 .env
            if (fs.existsSync('.env')) {
                const config = dotenv.parse(fs.readFileSync('.env'));
                this.env = { ...this.env, ...config };
                console.log('[DevServer] 已加載 .env');
            }
        }

        // 方式 2：讀取系統環境變量
        const envKeys = [
            'AZURE_SPEECH_KEY',
            'GEMINI_API_KEY',
            'AZURE_SPEECH_REGION',
            'APP_LANGUAGE',
            'DEBUG_MODE',
            'PUBLIC_URL'
        ];

        envKeys.forEach(key => {
            if (process.env[key]) {
                this.env[key] = process.env[key];
            }
        });

        if (Object.keys(this.env).length > 0) {
            console.log('[DevServer] 環境變量已加載');
            this.printEnvStatus();
        }
    }

    /**
     * 獲取客戶端安全的環境變量（不暴露所有密鑰）
     */
    getSafeEnv() {
        const safe = {};
        const allowedKeys = [
            'AZURE_SPEECH_REGION',
            'APP_LANGUAGE',
            'DEBUG_MODE',
            'PUBLIC_URL'
        ];

        // 只有在開發模式才發送 API 密鑰
        if (process.env.DEBUG_MODE === 'true' || this.env.DEBUG_MODE === 'true') {
            allowedKeys.push('AZURE_SPEECH_KEY', 'GEMINI_API_KEY');
        }

        allowedKeys.forEach(key => {
            if (this.env[key]) {
                safe[key] = this.env[key];
            }
        });

        return safe;
    }

    /**
     * 打印環境變量狀態
     */
    printEnvStatus() {
        console.log('\n[DevServer] 已加載的環境變量:');
        Object.keys(this.env).forEach(key => {
            if (this.isSecretKey(key)) {
                console.log(`  ${key}: ***${this.env[key].slice(-4)}`);
            } else {
                console.log(`  ${key}: ${this.env[key]}`);
            }
        });
        console.log('');
    }

    /**
     * 檢查是否是敏感密鑰
     */
    isSecretKey(key) {
        return key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD');
    }

    /**
     * 處理 HTTP 請求
     */
    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        let pathname = parsedUrl.pathname;

        // API 端點：/api/env - 返回環境變量
        if (pathname === '/api/env') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.getSafeEnv()));
            return;
        }

        // API 端點：/api/env-status - 返回環境變量狀態（僅調試）
        if (pathname === '/api/env-status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const status = {
                loaded: Object.keys(this.env).length > 0,
                keys: Object.keys(this.env).map(k => ({
                    name: k,
                    set: !!this.env[k],
                    secret: this.isSecretKey(k)
                }))
            };
            res.end(JSON.stringify(status));
            return;
        }

        // 靜態文件服務
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, pathname);

        // 安全檢查：防止目錄遍歷攻擊
        const normalizedPath = path.normalize(filePath);
        const baseDir = path.normalize(__dirname);
        if (!normalizedPath.startsWith(baseDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        // 檢查文件是否存在
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        // 讀取並發送文件
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = this.mimeTypes[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    }

    /**
     * 啟動服務器
     */
    start() {
        const server = http.createServer((req, res) => {
            // CORS 支持
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            this.handleRequest(req, res);
        });

        server.listen(PORT, HOST, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║          🎓 課堂膠囊 - 開發服務器已啟動                    ║
╠════════════════════════════════════════════════════════════╣
║  訪問地址: http://${HOST}:${PORT}                          
║  API 端點: http://${HOST}:${PORT}/api/env                  
║                                                            ║
║  快捷鍵:                                                    ║
║  - Ctrl+C 停止服務器                                        ║
║  - 更改 .env.local 後自動重新加載                          ║
║                                                            ║
║  📝 .env.local 優先級最高                                  ║
║  📄 .env 為備份配置                                        ║
║  🔒 密鑰不會在控制台打印（開發模式除外）                   ║
╚════════════════════════════════════════════════════════════╝
        `);
        });

        // 監控 .env 文件變化（可選）
        if (fs.watch && process.env.WATCH_ENV === 'true') {
            fs.watch('.', { recursive: false }, (eventType, filename) => {
                if (filename === '.env' || filename === '.env.local') {
                    console.log(`[DevServer] ${filename} 已變更，重新加載...`);
                    this.loadEnv();
                }
            });
        }
    }
}

// 啟動服務器
const server = new DevServer();
server.start();
