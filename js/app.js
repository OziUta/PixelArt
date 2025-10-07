class PixelArtApp {
    constructor() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            menu: document.getElementById('mainMenu'),
            sizeSelection: document.getElementById('sizeSelection'),
            workspace: document.getElementById('workspace')
        };
        
        this.currentScreen = 'loading';
        this.selectedSize = 16;
        this.editor = null;
        this.telegram = telegramApp;
        this.isInitialized = false;
    }
    
    async init() {
        console.log('Starting app initialization...');
        
        try {
            // Инициализируем Telegram интеграцию
            const isTelegram = await this.telegram.init();
            console.log('Telegram initialized:', isTelegram);
            
            if (isTelegram) {
                document.body.classList.add('is-telegram');
                // Устанавливаем обработчик кнопки назад
                this.telegram.setBackButtonCallback(() => this.handleBackButton());
            }
            
            this.isInitialized = true;
            
            // Переходим к главному меню
            this.showMainMenu();
            
        } catch (error) {
            console.error('Error during app initialization:', error);
            // Если что-то пошло не так, всё равно показываем меню
            this.showMainMenu();
        }
    }

    showMainMenu() {
        console.log('Showing main menu...');
        
        // Даём время на отрисовку анимации загрузки
        setTimeout(() => {
            this.switchScreen('menu');
            this.initMainMenu();
            this.initSizeSelection();
        }, 1000);
    }

    // Обработчик кнопки "Назад"
    handleBackButton() {
        console.log('Back button pressed on screen:', this.currentScreen);
        
        switch (this.currentScreen) {
            case 'menu':
                if (this.telegram.isInTelegram) {
                    this.telegram.tg.close();
                }
                break;
                
            case 'sizeSelection':
                this.returnToMenu();
                break;
                
            case 'workspace':
                this.returnToMenu();
                break;
                
            default:
                if (this.telegram.isInTelegram) {
                    this.telegram.tg.close();
                }
        }
    }
    
    switchScreen(targetScreen) {
        console.log('Switching screen to:', targetScreen);
        
        const currentElement = this.screens[this.currentScreen];
        const targetElement = this.screens[targetScreen];
        
        if (currentElement && targetElement) {
            currentElement.classList.add('screen-transition');
            
            setTimeout(() => {
                currentElement.classList.remove('active', 'screen-transition');
                targetElement.classList.add('active');
                
                setTimeout(() => {
                    targetElement.classList.add('screen-transition');
                    setTimeout(() => {
                        targetElement.classList.remove('screen-transition');
                    }, 600);
                }, 50);
                
                this.currentScreen = targetScreen;
                
                // Обновляем видимость кнопки "Назад" при смене экрана
                this.updateBackButtonVisibility();
            }, 300);
        } else {
            console.error('Screen elements not found:', { current: this.currentScreen, target: targetScreen });
        }
    }

    // Обновляем видимость кнопки "Назад"
    updateBackButtonVisibility() {
        if (!this.telegram.isInTelegram) return;
        
        console.log('Updating back button visibility for screen:', this.currentScreen);
        
        switch (this.currentScreen) {
            case 'menu':
                this.telegram.hideBackButton();
                break;
                
            case 'sizeSelection':
            case 'workspace':
                this.telegram.showBackButton();
                break;
        }
    }
    
    initMainMenu() {
        console.log('Initializing main menu...');
        this.loadRecentProjects();
    }
    
    initSizeSelection() {
        console.log('Initializing size selection...');
        
        const sizeOptions = document.querySelectorAll('.size-option');
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.selectedSize = parseInt(option.dataset.size);
                console.log('Selected size:', this.selectedSize);
            });
        });
        
        const defaultOption = document.querySelector('.size-option[data-size="16"]');
        if (defaultOption) {
            defaultOption.classList.add('active');
        }
    }
    
    loadRecentProjects() {
        const thumbnailsContainer = document.getElementById('recentProjects');
        if (!thumbnailsContainer) {
            console.error('Recent projects container not found');
            return;
        }
        
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        console.log('Loaded recent projects:', recentProjects.length);
        
        thumbnailsContainer.innerHTML = '';
        
        if (recentProjects.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'project-thumb';
            emptyMsg.textContent = 'Нет проектов';
            emptyMsg.style.background = 'rgba(255,255,255,0.05)';
            thumbnailsContainer.appendChild(emptyMsg);
            return;
        }
        
        recentProjects.slice(0, 4).forEach((project, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'project-thumb';
            
            if (project.thumbnail) {
                thumb.style.background = `url(${project.thumbnail}) center/cover`;
            } else {
                thumb.style.background = `linear-gradient(45deg, ${project.colors?.[0] || '#666'}, ${project.colors?.[1] || '#999'})`;
                thumb.textContent = project.name || `Проект ${index + 1}`;
            }
            
            thumb.title = project.name || `Проект ${index + 1}`;
            thumb.onclick = () => this.loadSavedProject(project);
            
            thumbnailsContainer.appendChild(thumb);
        });
    }
    
    startNewProject() {
        console.log('Starting new project...');
        this.switchScreen('sizeSelection');
    }
    
    confirmSizeSelection() {
        if (!this.selectedSize) {
            this.telegram.showAlert('Пожалуйста, выберите размер сетки');
            return;
        }
        
        console.log('Confirming size selection:', this.selectedSize);
        this.switchScreen('workspace');
        
        setTimeout(() => {
            this.initWorkspace();
        }, 500);
    }
    
    initWorkspace() {
        console.log('Initializing workspace...');
        
        const workspace = document.getElementById('pixelArtApp');
        if (!workspace) {
            console.error('Workspace container not found');
            return;
        }
        
        workspace.innerHTML = `
            <header class="toolbar">
                <div class="toolbar-center">
                    <div class="tools">
                        <button class="tool active" data-tool="brush" title="Кисть">🖌️</button>
                        <button class="tool" data-tool="eraser" title="Ластик">🧹</button>
                        <button class="tool" data-tool="fill" title="Заливка">🎨</button>
                    </div>
                    <div class="color-palette">
                        <div class="color active" style="background: #ff0000" data-color="#ff0000" title="Красный"></div>
                        <div class="color" style="background: #00ff00" data-color="#00ff00" title="Зеленый"></div>
                        <div class="color" style="background: #0000ff" data-color="#0000ff" title="Синий"></div>
                        <div class="color" style="background: #ffff00" data-color="#ffff00" title="Желтый"></div>
                        <div class="color" style="background: #ff00ff" data-color="#ff00ff" title="Пурпурный"></div>
                        <div class="color" style="background: #00ffff" data-color="#00ffff" title="Голубой"></div>
                        <div class="color" style="background: #ffffff" data-color="#ffffff" title="Белый"></div>
                        <div class="color" style="background: #000000" data-color="#000000" title="Черный"></div>
                    </div>
                </div>
                <div class="toolbar-right">
                    <div class="size-selector">
                        <span>Размер:</span>
                        <select id="gridSizeSelect">
                            <option value="8">8x8</option>
                            <option value="16" selected>16x16</option>
                            <option value="32">32x32</option>
                        </select>
                    </div>
                </div>
            </header>
            
            <main class="workspace">
                <div class="canvas-container">
                    <div class="pixel-grid" id="canvas"></div>
                </div>
            </main>
            
            <footer class="status-bar">
                <span>Размер: ${this.selectedSize}x${this.selectedSize}</span>
                <button class="export-btn">Экспорт PNG</button>
            </footer>
        `;
        
        // Настраиваем обработчики после создания DOM
        setTimeout(() => {
            const sizeSelect = document.getElementById('gridSizeSelect');
            if (sizeSelect) {
                sizeSelect.value = this.selectedSize;
                sizeSelect.onchange = (e) => this.changeGridSize(e.target.value);
            }
            
            const exportBtn = document.querySelector('.export-btn');
            if (exportBtn) {
                exportBtn.onclick = () => this.exportArtwork();
            }
            
            this.editor = new PixelArtEditor(this.selectedSize);
            console.log('Workspace initialized successfully');
        }, 100);
        
        this.updateBackButtonVisibility();
    }
    
    changeGridSize(newSize) {
        console.log('Changing grid size to:', newSize);
        
        if (this.editor) {
            this.editor.changeGridSize(parseInt(newSize));
            const statusBar = document.querySelector('.status-bar span');
            if (statusBar) {
                statusBar.textContent = `Размер: ${newSize}x${newSize}`;
            }
        }
    }
    
    returnToMenu() {
        console.log('Returning to menu...');
        
        if (this.editor) {
            this.saveCurrentProject();
        }
        
        this.switchScreen('menu');
        this.loadRecentProjects();
    }
    
    saveCurrentProject() {
        if (!this.editor) return;
        
        const projectData = this.editor.getProjectData();
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        
        recentProjects.unshift({
            name: `Проект ${new Date().toLocaleDateString()}`,
            data: projectData,
            gridSize: this.editor.gridSize,
            timestamp: Date.now(),
            colors: this.editor.getUsedColors(),
            thumbnail: this.editor.generateThumbnail()
        });
        
        if (recentProjects.length > 10) {
            recentProjects.pop();
        }
        
        localStorage.setItem('recentProjects', JSON.stringify(recentProjects));
        console.log('Project saved');
    }
    
    loadProject() {
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        if (recentProjects.length === 0) {
            this.telegram.showAlert('Нет сохраненных проектов!');
            return;
        }
        
        console.log('Loading project...');
        this.loadSavedProject(recentProjects[0]);
    }
    
    loadSavedProject(project) {
        this.selectedSize = project.gridSize || 16;
        this.switchScreen('workspace');
        setTimeout(() => {
            this.initWorkspace();
            if (this.editor && project.data) {
                setTimeout(() => {
                    this.editor.loadProject(project.data);
                    console.log('Project loaded successfully');
                }, 200);
            }
        }, 500);
    }
    
    exportArtwork() {
        if (this.editor) {
            console.log('Exporting artwork...');
            this.editor.exportAsPNG();
        }
    }
    
    shareProject() {
        if (this.editor) {
            const imageUrl = this.editor.generateThumbnail();
            this.telegram.shareProject(imageUrl);
        }
    }
    
    openGallery() {
        this.telegram.showAlert('Галерея в разработке! 🎨\nСкоро здесь появятся работы других художников!');
    }
    
    showTutorial() {
        this.telegram.showAlert('Обучение в разработке! 📚\nСкоро здесь появятся уроки по созданию пиксель-арта!');
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    app = new PixelArtApp();
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        // Fallback: показываем меню даже если инициализация не удалась
        setTimeout(() => {
            if (app.screens.menu) {
                app.screens.loading.classList.remove('active');
                app.screens.menu.classList.add('active');
                app.currentScreen = 'menu';
            }
        }, 2000);
    });
});
