class TelegramIntegration {
    constructor() {
        this.tg = null;
        this.initParams = null;
        this.user = null;
        this.isTelegram = false;
    }

    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.isTelegram = true;
            this.setupTelegramApp();
        } else {
            this.setupStandaloneApp();
        }
    }

    setupTelegramApp() {
        console.log('Initializing Telegram Web App...');
        
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        this.user = this.tg.initDataUnsafe?.user;
        this.initParams = this.tg.initData;
        
        this.setupTheme();
        this.setupMainButton();
        this.setupEventListeners();
        
        console.log('Telegram Web App ready. User:', this.user);
    }

    setupStandaloneApp() {
        console.log('Running in standalone mode');
    }

    setupTheme() {
        document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#1a1a1a');
        document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#aaaaaa');
        document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#3390ec');
        document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#3390ec');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
        
        this.applyThemeToElements();
        this.tg.onEvent('themeChanged', this.applyThemeToElements.bind(this));
    }

    applyThemeToElements() {
        const theme = this.tg.colorScheme;
        
        if (theme === 'dark') {
            document.body.classList.add('tg-theme-dark');
            document.body.classList.remove('tg-theme-light');
        } else {
            document.body.classList.add('tg-theme-light');
            document.body.classList.remove('tg-theme-dark');
        }
        
        document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || (theme === 'dark' ? '#1a1a1a' : '#ffffff'));
        document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || (theme === 'dark' ? '#ffffff' : '#000000'));
    }

    setupMainButton() {
        this.tg.MainButton.setText('Сохранить в Telegram');
        this.tg.MainButton.hide();
    }

    setupEventListeners() {
        this.tg.MainButton.onClick(this.onMainButtonClick.bind(this));
        this.tg.onEvent('viewportChanged', this.onViewportChanged.bind(this));
    }

    onMainButtonClick() {
        if (window.app && window.app.editor) {
            const projectData = window.app.editor.getProjectData();
            this.sendDataToBot(projectData);
        }
    }

    onViewportChanged() {
        this.adjustLayout();
    }

    sendDataToBot(data) {
        if (this.isTelegram) {
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
        }
    }

    shareProject(imageUrl) {
        if (this.isTelegram) {
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
        } else {
            alert('Функция "Поделиться" доступна только в Telegram');
        }
    }

    showAlert(message) {
        if (this.isTelegram) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }

    showConfirm(message, callback) {
        if (this.isTelegram) {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    adjustLayout() {
        const viewport = this.tg.viewportHeight;
        if (viewport) {
            document.documentElement.style.setProperty('--tg-viewport-height', `${viewport}px`);
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
// В telegram.js
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.onEvent('viewportChanged', function() {
        // Обновляем сетку при изменении viewport в Telegram
        setTimeout(() => {
            if (currentScreen === 'workspace') {
                gridManager.setSize(currentGridSize);
            }
        }, 100);
    });
}
const telegramApp = new TelegramIntegration();

