class TelegramIntegration {
    constructor() {
        this.tg = null;
        this.initParams = null;
        this.user = null;
        this.isTelegram = false;
        this.onBackButtonCallback = null;
        this.isInitialized = false;
    }

    init() {
        return new Promise((resolve) => {
            if (window.Telegram && window.Telegram.WebApp) {
                this.tg = window.Telegram.WebApp;
                this.isTelegram = true;
                this.setupTelegramApp();
                console.log('Telegram Web App initialized');
                resolve(true);
            } else {
                this.setupStandaloneApp();
                console.log('Standalone mode initialized');
                resolve(false);
            }
        });
    }

    setupTelegramApp() {
        try {
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            this.user = this.tg.initDataUnsafe?.user;
            this.initParams = this.tg.initData;
            
            this.setupTheme();
            this.setupBackButton();
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            console.log('Telegram Web App ready. User:', this.user);
        } catch (error) {
            console.error('Error setting up Telegram app:', error);
            this.setupStandaloneApp();
        }
    }

    setupStandaloneApp() {
        this.isTelegram = false;
        this.isInitialized = true;
        console.log('Running in standalone mode');
    }

    setupTheme() {
        if (!this.tg) return;
        
        try {
            document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#1a1a1a');
            document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#aaaaaa');
            document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#3390ec');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
            
            this.applyThemeToElements();
            this.tg.onEvent('themeChanged', this.applyThemeToElements.bind(this));
        } catch (error) {
            console.error('Error setting up theme:', error);
        }
    }

    applyThemeToElements() {
        if (!this.tg) return;
        
        try {
            const theme = this.tg.colorScheme;
            
            if (theme === 'dark') {
                document.body.classList.add('tg-theme-dark');
                document.body.classList.remove('tg-theme-light');
            } else {
                document.body.classList.add('tg-theme-light');
                document.body.classList.remove('tg-theme-dark');
            }
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    setupBackButton() {
        if (!this.tg) return;
        
        try {
            this.tg.BackButton.onClick(this.handleBackButton.bind(this));
        } catch (error) {
            console.error('Error setting up back button:', error);
        }
    }

    handleBackButton() {
        if (this.onBackButtonCallback) {
            this.onBackButtonCallback();
        } else if (this.tg) {
            this.tg.close();
        }
    }

    setupEventListeners() {
        if (!this.tg) return;
        
        try {
            this.tg.onEvent('viewportChanged', this.onViewportChanged.bind(this));
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    onViewportChanged() {
        this.adjustLayout();
    }

    setBackButtonCallback(callback) {
        this.onBackButtonCallback = callback;
    }

    showBackButton() {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.BackButton.show();
            } catch (error) {
                console.error('Error showing back button:', error);
            }
        }
    }

    hideBackButton() {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.BackButton.hide();
            } catch (error) {
                console.error('Error hiding back button:', error);
            }
        }
    }

    sendDataToBot(data) {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.sendData(JSON.stringify({
                    type: 'pixel_art_project',
                    data: data,
                    timestamp: Date.now(),
                    user: this.user
                }));
                
                this.tg.showPopup({
                    title: 'Успех!',
                    message: 'Проект сохранен в Telegram',
                    buttons: [{ type: 'ok' }]
                });
            } catch (error) {
                console.error('Error sending data to bot:', error);
            }
        }
    }

    shareProject(imageUrl) {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.showPopup({
                    title: 'Поделиться рисунком',
                    message: 'Хотите отправить свой рисунок?',
                    buttons: [
                        {
                            type: 'default',
                            text: 'Поделиться',
                            id: 'share'
                        },
                        {
                            type: 'cancel',
                            id: 'cancel'
                        }
                    ]
                }, (buttonId) => {
                    if (buttonId === 'share') {
                        this.tg.sendData(JSON.stringify({
                            type: 'share_image',
                            image: imageUrl
                        }));
                    }
                });
            } catch (error) {
                console.error('Error sharing project:', error);
            }
        } else {
            alert('Функция "Поделиться" доступна только в Telegram');
        }
    }

    showAlert(message) {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.showAlert(message);
            } catch (error) {
                console.error('Error showing alert:', error);
                alert(message);
            }
        } else {
            alert(message);
        }
    }

    showConfirm(message, callback) {
        if (this.isTelegram && this.tg) {
            try {
                this.tg.showConfirm(message, callback);
            } catch (error) {
                console.error('Error showing confirm:', error);
                const result = confirm(message);
                callback(result);
            }
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    adjustLayout() {
        if (this.isTelegram && this.tg) {
            try {
                const viewport = this.tg.viewportHeight;
                if (viewport) {
                    document.documentElement.style.setProperty('--tg-viewport-height', `${viewport}px`);
                }
            } catch (error) {
                console.error('Error adjusting layout:', error);
            }
        }
    }

    get isInTelegram() {
        return this.isTelegram;
    }

    getUser() {
        return this.user;
    }

    getInitParams() {
        return this.initParams;
    }
}

const telegramApp = new TelegramIntegration();
