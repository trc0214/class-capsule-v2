/**
 * 課堂膠囊 - 主應用邏輯
 * 協調 UI、Azure Speech 和 Gemini API 的交互
 */

class ClassroomCapsuleApp {
    constructor() {
        this.recordingTimer = null;
        this.recordingSeconds = 0;
        this.isWorking = false;
        
        this.initializeEventListeners();
        this.loadSavedKeys();
    }

    /**
     * 初始化所有事件監聽器
     */
    initializeEventListeners() {
        // 配置面板
        document.getElementById('saveKeysBtn').addEventListener('click', () => this.saveKeys());
        document.getElementById('clearKeysBtn').addEventListener('click', () => this.clearKeys());

        // 錄音控制
        document.getElementById('startBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetRecording());

        // 轉錄操作
        document.getElementById('copyTranscriptBtn').addEventListener('click', () => this.copyTranscript());
        document.getElementById('downloadTranscriptBtn').addEventListener('click', () => this.downloadTranscript());
        document.getElementById('clearTranscriptBtn').addEventListener('click', () => this.clearTranscript());

        // 摘要操作
        document.getElementById('generateSummaryBtn').addEventListener('click', () => this.generateSummary());
        document.getElementById('copySummaryBtn').addEventListener('click', () => this.copySummary());
        document.getElementById('downloadSummaryBtn').addEventListener('click', () => this.downloadSummary());
        document.getElementById('clearSummaryBtn').addEventListener('click', () => this.clearSummary());

        // 幫助和錯誤對話框
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });
        document.getElementById('errorCloseBtn').addEventListener('click', () => this.closeErrorModal());

        // Azure 服務回調
        window.azureSpeechService.onTranscriptUpdate = (transcript, sentenceCount) => {
            this.updateTranscript(transcript, sentenceCount);
        };
        
        window.azureSpeechService.onStatusChange = (status, statusClass) => {
            this.updateStatus(status, statusClass);
        };
        
        window.azureSpeechService.onRecognitionEnd = (transcript) => {
            this.onRecognitionComplete(transcript);
        };
        
        window.azureSpeechService.onError = (error) => {
            this.showError(error);
        };

        // Gemini 服務回調
        window.geminiService.onProgress = (message) => {
            this.updateProgress(message);
        };
        
        window.geminiService.onComplete = (summary) => {
            this.onSummaryComplete(summary);
        };
        
        window.geminiService.onError = (error) => {
            this.showError(error);
        };

        // 點擊模態外部關閉
        window.addEventListener('click', (event) => {
            const helpModal = document.getElementById('helpModal');
            const errorModal = document.getElementById('errorModal');
            
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
            if (event.target === errorModal) {
                errorModal.style.display = 'none';
            }
        });

        // 定期更新統計信息
        setInterval(() => this.updateStats(), 1000);
    }

    /**
     * 保存 API 密鑰
     */
    saveKeys() {
        const azureKey = document.getElementById('azureKey').value.trim();
        const geminiKey = document.getElementById('geminiKey').value.trim();
        
        const statusEl = document.getElementById('configStatus');

        // 驗證
        if (!azureKey || !window.configManager.validateAzureKey(azureKey)) {
            this.showStatusMessage(statusEl, '❌ Azure Key 無效或為空', 'error');
            return;
        }

        if (!geminiKey || !window.configManager.validateGeminiKey(geminiKey)) {
            this.showStatusMessage(statusEl, '❌ Gemini Key 無效或為空', 'error');
            return;
        }

        // 保存
        try {
            window.configManager.setKey('azureKey', azureKey);
            window.configManager.setKey('geminiKey', geminiKey);
            
            // 清空密碼字段以保持安全
            document.getElementById('azureKey').value = '';
            document.getElementById('geminiKey').value = '';
            
            this.showStatusMessage(statusEl, '✅ 設定成功保存！密鑰已安全存儲在本地。', 'success');
            this.updateButtonStates();
            
        } catch (error) {
            this.showStatusMessage(statusEl, '❌ 保存失敗: ' + error.message, 'error');
        }
    }

    /**
     * 清除所有密鑰
     */
    clearKeys() {
        if (!confirm('確定要清除所有 API 密鑰嗎？')) {
            return;
        }

        window.configManager.clearAllKeys();
        
        const statusEl = document.getElementById('configStatus');
        this.showStatusMessage(statusEl, '✅ 所有密鑰已清除', 'success');
        this.updateButtonStates();
    }

    /**
     * 開始錄音
     */
    async startRecording() {
        if (!this.validateKeys()) {
            return;
        }

        // 禁用按鈕
        document.getElementById('startBtn').disabled = true;
        document.getElementById('resetBtn').disabled = true;

        const success = await window.azureSpeechService.startRecognition();
        
        if (success) {
            document.getElementById('stopBtn').disabled = false;
            this.startRecordingTimer();
            this.updateButtonStates();
        } else {
            document.getElementById('startBtn').disabled = false;
            document.getElementById('resetBtn').disabled = false;
        }
    }

    /**
     * 停止錄音
     */
    async stopRecording() {
        await window.azureSpeechService.stopRecognition();
        
        this.stopRecordingTimer();
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('resetBtn').disabled = false;
        this.updateButtonStates();
    }

    /**
     * 重置錄音
     */
    resetRecording() {
        if (this.recordingSeconds > 0 && !confirm('確定要重置錄音嗎？')) {
            return;
        }

        window.azureSpeechService.reset();
        this.clearTranscript();
        this.clearSummary();
        this.recordingSeconds = 0;
        document.getElementById('recordingTime').textContent = '00:00:00';
        document.getElementById('statusIndicator').textContent = '就緒';
        document.getElementById('statusIndicator').className = 'status-indicator';
        this.updateButtonStates();
    }

    /**
     * 驗證密鑰是否已設定
     */
    validateKeys() {
        const status = window.configManager.getStatus();
        
        if (!status.azureConfigured || !status.geminiConfigured) {
            this.showError('❌ 請先在設定面板中輸入 Azure Speech 和 Gemini API 密鑰');
            return false;
        }

        return true;
    }

    /**
     * 開始記時
     */
    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            const hours = Math.floor(this.recordingSeconds / 3600);
            const minutes = Math.floor((this.recordingSeconds % 3600) / 60);
            const seconds = this.recordingSeconds % 60;
            
            document.getElementById('recordingTime').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * 停止記時
     */
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    /**
     * 更新轉錄文本
     */
    updateTranscript(transcript, sentenceCount) {
        const transcriptEl = document.getElementById('transcript');
        transcriptEl.textContent = transcript;
        this.updateStats();
    }

    /**
     * 更新狀態顯示
     */
    updateStatus(status, statusClass) {
        const indicator = document.getElementById('statusIndicator');
        indicator.textContent = status;
        
        // 移除所有狀態類
        indicator.className = 'status-indicator';
        
        // 添加對應的類別
        if (statusClass) {
            indicator.classList.add(statusClass);
        }
    }

    /**
     * 識別完成回調
     */
    onRecognitionComplete(transcript) {
        this.showStatusMessage(
            document.getElementById('configStatus'),
            '✅ 識別完成！',
            'success',
            3000
        );
    }

    /**
     * 複製轉錄文本
     */
    copyTranscript() {
        const transcript = window.azureSpeechService.getTranscript();
        if (!transcript) {
            this.showError('沒有轉錄文本可複製');
            return;
        }

        navigator.clipboard.writeText(transcript).then(() => {
            this.showStatusMessage(
                document.getElementById('configStatus'),
                '✅ 轉錄文本已複製到剪貼板',
                'success',
                2000
            );
        }).catch(err => {
            console.error('複製失敗:', err);
            this.showError('複製失敗');
        });
    }

    /**
     * 下載轉錄文本
     */
    downloadTranscript() {
        const transcript = window.azureSpeechService.getTranscript();
        if (!transcript) {
            this.showError('沒有轉錄文本可下載');
            return;
        }

        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcript-${Date.now()}.txt`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * 清除轉錄文本
     */
    clearTranscript() {
        document.getElementById('transcript').innerHTML = '<p class="placeholder">轉錄文本將在此顯示...</p>';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('sentenceCount').textContent = '0';
        document.getElementById('copyTranscriptBtn').disabled = true;
        document.getElementById('downloadTranscriptBtn').disabled = true;
        document.getElementById('clearTranscriptBtn').disabled = true;
        document.getElementById('generateSummaryBtn').disabled = true;
    }

    /**
     * 生成摘要
     */
    async generateSummary() {
        const transcript = window.azureSpeechService.getTranscript();
        if (!transcript || transcript.trim().length === 0) {
            this.showError('請先進行課堂錄音');
            return;
        }

        const style = document.getElementById('summaryStyle').value;
        const length = document.getElementById('summaryLength').value;
        
        this.isWorking = true;
        document.getElementById('generateSummaryBtn').disabled = true;
        this.showProgress(true);

        const summary = await window.geminiService.generateSummary(
            transcript,
            style,
            length,
            false // 使用 Flash 模型，可選 true 使用 Pro 模型
        );

        if (summary) {
            this.displaySummary(summary);
        }

        this.isWorking = false;
        document.getElementById('generateSummaryBtn').disabled = false;
        this.showProgress(false);
    }

    /**
     * 顯示摘要文本
     */
    displaySummary(summary) {
        const summaryEl = document.getElementById('summary');
        summaryEl.textContent = summary;
        
        // 顯示摘要操作按鈕
        document.getElementById('summaryActions').style.display = 'flex';
        document.getElementById('copySummaryBtn').disabled = false;
        document.getElementById('downloadSummaryBtn').disabled = false;
        document.getElementById('clearSummaryBtn').disabled = false;
    }

    /**
     * 複製摘要
     */
    copySummary() {
        const summary = document.getElementById('summary').textContent;
        if (!summary || summary.includes('摘要將在此顯示')) {
            this.showError('沒有摘要文本可複製');
            return;
        }

        navigator.clipboard.writeText(summary).then(() => {
            this.showStatusMessage(
                document.getElementById('summaryStatus'),
                '✅ 摘要已複製到剪貼板',
                'success',
                2000
            );
        });
    }

    /**
     * 下載摘要
     */
    downloadSummary() {
        const summary = document.getElementById('summary').textContent;
        if (!summary || summary.includes('摘要將在此顯示')) {
            this.showError('沒有摘要文本可下載');
            return;
        }

        window.geminiService.downloadAsMarkdown(summary);
    }

    /**
     * 清除摘要
     */
    clearSummary() {
        document.getElementById('summary').innerHTML = '<p class="placeholder">摘要將在此顯示...</p>';
        document.getElementById('summaryActions').style.display = 'none';
        document.getElementById('summaryStatus').innerHTML = '';
    }

    /**
     * 摘要生成完成回調
     */
    onSummaryComplete(summary) {
        this.showStatusMessage(
            document.getElementById('summaryStatus'),
            '✅ 摘要已生成！',
            'success',
            2000
        );
    }

    /**
     * 更新統計信息
     */
    updateStats() {
        const stats = window.azureSpeechService.getStats();
        document.getElementById('sentenceCount').textContent = stats.sentenceCount;
        document.getElementById('charCount').textContent = stats.charCount;
        
        // 更新按鈕狀態
        const hasTranscript = stats.charCount > 0;
        document.getElementById('copyTranscriptBtn').disabled = !hasTranscript;
        document.getElementById('downloadTranscriptBtn').disabled = !hasTranscript;
        document.getElementById('clearTranscriptBtn').disabled = !hasTranscript;
        document.getElementById('generateSummaryBtn').disabled = !hasTranscript;
    }

    /**
     * 更新按鈕狀態
     */
    updateButtonStates() {
        const status = window.configManager.getStatus();
        const hasKeys = status.azureConfigured && status.geminiConfigured;
        
        document.getElementById('startBtn').disabled = !hasKeys;
    }

    /**
     * 顯示進度
     */
    showProgress(show) {
        const container = document.getElementById('progressContainer');
        if (show) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * 更新進度
     */
    updateProgress(message) {
        document.getElementById('progressText').textContent = message;
    }

    /**
     * 加載已保存的密鑰狀態
     */
    loadSavedKeys() {
        const status = window.configManager.getStatus();
        if (status.azureConfigured) {
            document.getElementById('azureKey').placeholder = '✓ 已設定';
        }
        if (status.geminiConfigured) {
            document.getElementById('geminiKey').placeholder = '✓ 已設定';
        }
        this.updateButtonStates();
    }

    /**
     * 顯示狀態消息
     */
    showStatusMessage(element, message, type, duration = 0) {
        element.textContent = message;
        element.className = `status-message ${type}`;
        
        if (duration > 0) {
            setTimeout(() => {
                element.className = 'status-message';
                element.textContent = '';
            }, duration);
        }
    }

    /**
     * 顯示幫助對話框
     */
    showHelp() {
        document.getElementById('helpModal').style.display = 'block';
    }

    /**
     * 顯示錯誤對話框
     */
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').style.display = 'block';
    }

    /**
     * 關閉錯誤對話框
     */
    closeErrorModal() {
        document.getElementById('errorModal').style.display = 'none';
    }

    /**
     * 關閉模態對話框
     */
    closeModal(event) {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// 應用初始化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ClassroomCapsuleApp();
    console.log('課堂膠囊應用已啟動！');
});
