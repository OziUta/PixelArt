// app.js - управление навигацией и основным приложением
const app = {
    currentScreen: 'loadingScreen',
    
    init() {
        this.detectTelegram();
        this.setupEventListeners();
        this.initSizeSelection();
        this.showLoadingScreen();
    },
    
    detectTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            document.body.classList.add('is-telegram');
            
            // Инициализируем Telegram Web App
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            // Устанавливаем тему
            const theme = Telegram.WebApp.colorScheme;
            document.body.classList.add(theme === 'dark' ? 'tg-theme-dark' : 'tg-theme-light');
        } else {
            document.body.classList.add('tg-theme-dark');
        }
    },
    
    setupEventListeners() {
        // Обработчики для кнопок меню
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.classList[1]; // new-project, load-project, etc.
                console.log('Menu action:', action);
            });
        });
    },
    
    initSizeSelection() {
        const sizeOptions = document.querySelectorAll('.size-option');
        let selectedSize = 16;
        
        sizeOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Убираем активный класс у всех опций
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                // Добавляем активный класс к выбранной опции
                this.classList.add('active');
                // Сохраняем выбранный размер
                selectedSize = parseInt(this.getAttribute('data-size'));
            });
        });
        
        // Активируем размер по умолчанию
        if (sizeOptions[1]) {
            sizeOptions[1].classList.add('active'); // 16x16
        }
        
        this.sizeSelector = {
            getSelectedSize: () => selectedSize
        };
    },
    
    showLoadingScreen() {
        // Имитируем загрузку
        setTimeout(() => {
            this.switchScreen('mainMenu');
        }, 2000);
    },
    
    switchScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показываем целевой экран
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Особые действия для разных экранов
            if (screenName === 'workspace') {
                this.onWorkspaceOpen();
            }
        }
    },
    
    onWorkspaceOpen() {
        // Даем время на отрисовку DOM перед созданием сетки
        setTimeout(() => {
            if (window.editor && window.editor.refreshGrid) {
                window.editor.refreshGrid();
            }
        }, 50);
    },
    
    // Навигационные методы
    startNewProject() {
        this.switchScreen('sizeSelection');
    },
    
    returnToMenu() {
        this.switchScreen('mainMenu');
    },
    
    confirmSizeSelection() {
        const selectedSize = this.sizeSelector.getSelectedSize();
        
        if (window.editor && window.editor.setGridSize) {
            window.editor.setGridSize(selectedSize);
        }
        
        this.switchScreen('workspace');
    },
    
    loadProject() {
        // TODO: Реализовать загрузку проектов
        alert('Функция загрузки проектов в разработке');
    },
    
    openGallery() {
        // TODO: Реализовать галерею
        alert('Галерея в разработке');
    },
    
    showTutorial() {
        // TODO: Реализовать обучение
        alert('Обучение в разработке');
    },
    
    exportImage() {
        if (window.editor && window.editor.exportImage) {
            window.editor.exportImage();
        }
    },
    
    saveToTelegram() {
        if (window.editor && window.editor.saveToTelegram) {
            window.editor.saveToTelegram();
        }
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});

// Глобальные функции для HTML onclick
window.app = app;
