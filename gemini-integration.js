/**
 * Google Gemini API 集成
 * 支持結構化筆記摘要生成、多種風格和長度選項
 */

class GeminiService {
    constructor() {
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.proEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
        
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    /**
     * 生成結構化筆記摘要
     * @param {string} transcript - 原始轉錄文本
     * @param {string} style - 摘要風格 ('structured', 'bullet', 'qa', 'mindmap')
     * @param {string} length - 摘要長度 ('short', 'medium', 'long')
     * @param {boolean} useProModel - 是否使用 Pro 模型（更準確）
     */
    async generateSummary(transcript, style = 'structured', length = 'medium', useProModel = false) {
        if (!transcript || transcript.trim().length === 0) {
            this._error('轉錄文本不能為空');
            return null;
        }

        const geminiKey = window.configManager.getKey('geminiKey');
        if (!geminiKey) {
            this._error('請先設定 Gemini API 密鑰');
            return null;
        }

        try {
            if (this.onProgress) {
                this.onProgress('正在生成摘要，請稍候...');
            }

            // 根據風格和長度準備提示詞
            const prompt = this._buildPrompt(transcript, style, length);
            
            // 選擇模型
            const endpoint = useProModel ? this.proEndpoint : this.apiEndpoint;
            const url = `${endpoint}?key=${geminiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.95,
                        maxOutputTokens: this._getMaxTokens(length),
                        stopSequences: [],
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_NONE',
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_NONE',
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_NONE',
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_NONE',
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API 錯誤 (${response.status}): ${errorData.error?.message || '未知錯誤'}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0] && result.candidates[0].content) {
                const summary = result.candidates[0].content.parts[0].text;
                
                if (this.onComplete) {
                    this.onComplete(summary);
                }
                
                return summary;
            } else {
                throw new Error('未能從 Gemini API 獲得有效響應');
            }

        } catch (error) {
            this._error(error.message);
            return null;
        }
    }

    /**
     * 根據風格和長度組建提示詞
     */
    _buildPrompt(transcript, style, length) {
        let lengthGuide = '';
        switch (length) {
            case 'short':
                lengthGuide = '大約 500 字';
                break;
            case 'long':
                lengthGuide = '大約 2000 字，包含詳細細節和示例';
                break;
            case 'medium':
            default:
                lengthGuide = '大約 1000 字';
        }

        let styleGuide = '';
        let styleFormat = '';

        switch (style) {
            case 'bullet':
                styleGuide = '以重點列表形式組織';
                styleFormat = '使用 • 符號列出主要重點';
                break;
            
            case 'qa':
                styleGuide = '以問答形式組織';
                styleFormat = '列出課程內容中的關鍵問題和答案';
                break;
            
            case 'mindmap':
                styleGuide = '以思維導圖形式組織';
                styleFormat = '使用層級結構展示概念之間的關係，格式如:\n中心主題\n├── 主要分支 1\n│   ├── 子概念\n│   └── 子概念\n└── 主要分支 2';
                break;
            
            case 'structured':
            default:
                styleGuide = '以結構化筆記形式組織';
                styleFormat = '包含以下部分:\n1. 課程主題\n2. 核心概念\n3. 關鍵重點\n4. 重要術語和定義\n5. 實踐應用\n6. 總結要點';
        }

        const prompt = `您是一位專業的學術筆記助手。請根據以下課堂錄音轉錄生成高質量的摘要筆記。

## 轉錄內容
${transcript}

## 摘要要求
- 長度: ${lengthGuide}
- 組織方式: ${styleGuide}
- 格式指南: ${styleFormat}
- 語言: 繁體中文（Traditional Chinese）
- 目標受眾: 資訊工程系學生
- 包含資訊工程相關術語的準確翻譯或解釋

## 額外指導
1. 保留課程中的技術術語（如 API、Database、Algorithm 等），並在必要時提供中文解釋
2. 識別並強調最重要的概念
3. 如果內容涉及程式碼概念，請提供簡要解釋
4. 確保邏輯流暢和信息準確
5. 使用清晰的標題和副標題

請開始生成摘要:`;

        return prompt;
    }

    /**
     * 根據長度獲取最大 token 數
     */
    _getMaxTokens(length) {
        switch (length) {
            case 'short':
                return 1000;
            case 'long':
                return 4000;
            case 'medium':
            default:
                return 2000;
        }
    }

    /**
     * 內部錯誤處理
     */
    _error(message) {
        console.error('Gemini 錯誤:', message);
        if (this.onError) {
            this.onError(message);
        }
    }

    /**
     * 驗證 Gemini API 密鑰
     */
    async validateApiKey(apiKey) {
        try {
            const testUrl = `${this.apiEndpoint}?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: 'test'
                                }
                            ]
                        }
                    ],
                }),
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 將摘要轉換為 Markdown 格式
     */
    toMarkdown(summary, title = '課堂摘要') {
        const timestamp = new Date().toLocaleString('zh-TW');
        let markdown = `# ${title}\n\n`;
        markdown += `**生成時間**: ${timestamp}\n\n`;
        markdown += `---\n\n`;
        markdown += summary;
        markdown += `\n\n---\n\n`;
        markdown += `*由「課堂膠囊」AI 助手生成*`;
        
        return markdown;
    }

    /**
     * 將摘要導出為 Markdown 文件
     */
    downloadAsMarkdown(summary, filename = 'lecture-summary') {
        const markdown = this.toMarkdown(summary);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${Date.now()}.md`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// 全局 Gemini 服務實例
window.geminiService = new GeminiService();

// 導出以支持模塊系統
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiService;
}
