/**
 * Azure Speech 服務集成
 * 支持實時流式語音轉文字 (STT)，適用於 japaneast 地區
 * 使用 Web Audio API 和 Azure Cognitive Services REST API
 */

class AzureSpeechService {
    constructor() {
        this.recognizer = null;
        this.stream = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.processor = null;
        
        this.azureRegion = 'japaneast';
        this.language = 'zh-CN'; // 中文（簡體）
        this.isRecording = false;
        this.transcript = '';
        this.sentenceCount = 0;
        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        
        this.onTranscriptUpdate = null;
        this.onRecognitionEnd = null;
        this.onError = null;
        this.onStatusChange = null;
    }

    /**
     * 初始化並啟動識別
     */
    async startRecognition() {
        if (this.isRecording) {
            console.warn('已在識別中');
            return false;
        }

        try {
            const azureKey = window.configManager.getKey('azureKey');
            if (!azureKey) {
                this._error('請先設定 Azure Speech API 密鑰');
                return false;
            }

            // 請求麥克風權限
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                } 
            });

            // 初始化音頻上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.stream);

            // 使用 ScriptProcessorNode 捕獲音頻數據
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            this.transcript = '';
            this.sentenceCount = 0;
            this.connectionAttempts = 0;
            
            if (this.onStatusChange) {
                this.onStatusChange('識別中', 'recording');
            }

            // 啟動識別循環
            await this._startContinuousRecognition();
            return true;

        } catch (error) {
            this._error('無法啟動識別: ' + error.message);
            return false;
        }
    }

    /**
     * 停止識別
     */
    async stopRecognition() {
        if (!this.isRecording) {
            return;
        }

        try {
            this.isRecording = false;

            // 清理資源
            if (this.processor) {
                this.processor.disconnect();
            }
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            if (this.audioContext) {
                await this.audioContext.close();
            }

            if (this.onStatusChange) {
                this.onStatusChange('已停止', 'stopped');
            }

            if (this.onRecognitionEnd) {
                this.onRecognitionEnd(this.transcript);
            }

        } catch (error) {
            console.error('停止識別時出錯:', error);
        }
    }

    /**
     * 私有方法：開始連續識別循環
     */
    async _startContinuousRecognition() {
        const azureKey = window.configManager.getKey('azureKey');
        let audioBuffer = [];
        let lastRequestTime = 0;
        const REQUEST_INTERVAL = 2000; // 每 2 秒發送一次請求

        this.processor.onaudioprocess = async (event) => {
            if (!this.isRecording) return;

            // 獲取音頻數據
            const inputData = event.inputBuffer.getChannelData(0);
            
            // 轉換為 16-bit PCM
            const pcmData = this._floatTo16BitPCM(inputData);
            audioBuffer.push(...Array.from(new Uint8Array(pcmData)));

            const currentTime = Date.now();
            
            // 定期發送音頻數據進行識別
            if (currentTime - lastRequestTime > REQUEST_INTERVAL && audioBuffer.length > 0) {
                lastRequestTime = currentTime;
                
                try {
                    await this._recognizeAudio(
                        new Uint8Array(audioBuffer),
                        azureKey
                    );
                    audioBuffer = []; // 清空緩衝區
                } catch (error) {
                    console.error('識別請求失敗:', error);
                    
                    // 實現重連機制
                    if (this.connectionAttempts < this.maxConnectionAttempts) {
                        this.connectionAttempts++;
                        console.log(`正在重新連接... (嘗試 ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
                        if (this.onStatusChange) {
                            this.onStatusChange(`重新連接中... (${this.connectionAttempts}/${this.maxConnectionAttempts})`, 'reconnecting');
                        }
                    } else {
                        this._error('連接失敗，已超過最大重試次數');
                        await this.stopRecognition();
                    }
                }
            }
        };
    }

    /**
     * 向 Azure 發送音頻進行識別
     */
    async _recognizeAudio(audioData, apiKey) {
        const url = `https://${this.azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.language}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'audio/pcm; codec=audio/pcm; samplerate=16000',
                },
                body: audioData,
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.RecognitionStatus === 'Success' && result.DisplayText) {
                    // 檢查是否是新的完整句子
                    if (!this.transcript.includes(result.DisplayText)) {
                        if (this.transcript && !this.transcript.endsWith('\n')) {
                            this.transcript += '\n';
                        }
                        this.transcript += result.DisplayText;
                        this.sentenceCount++;
                        this.connectionAttempts = 0; // 重置連接計數
                        
                        if (this.onTranscriptUpdate) {
                            this.onTranscriptUpdate(this.transcript, this.sentenceCount);
                        }
                    }
                } else if (result.RecognitionStatus === 'InitialSilenceTimeout') {
                    // 無聲，繼續等待
                } else if (result.RecognitionStatus === 'BabbleTimeout') {
                    // 噪音，繼續
                }
            } else {
                throw new Error(`Azure API 錯誤: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * 將浮點音頻數據轉換為 16-bit PCM
     */
    _floatTo16BitPCM(floatArray) {
        const buffer = new ArrayBuffer(floatArray.length * 2);
        const view = new Int16Array(buffer);
        for (let i = 0; i < floatArray.length; i++) {
            view[i] = Math.max(-1, Math.min(1, floatArray[i])) < 0 
                ? floatArray[i] * 0x8000 
                : floatArray[i] * 0x7FFF;
        }
        return buffer;
    }

    /**
     * 內部錯誤處理
     */
    _error(message) {
        console.error(message);
        if (this.onError) {
            this.onError(message);
        }
    }

    /**
     * 重置識別器
     */
    reset() {
        this.transcript = '';
        this.sentenceCount = 0;
        this.isRecording = false;
        this.connectionAttempts = 0;
    }

    /**
     * 獲取當前轉錄文本
     */
    getTranscript() {
        return this.transcript;
    }

    /**
     * 獲取識別統計信息
     */
    getStats() {
        return {
            sentenceCount: this.sentenceCount,
            charCount: this.transcript.length,
            isRecording: this.isRecording,
        };
    }
}

// 全局 Azure 語音服務實例
window.azureSpeechService = new AzureSpeechService();

// 導出以支持模塊系統
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AzureSpeechService;
}
