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
        this.init();
    }
    
    init() {
        this.telegram.init();
        
        if (this.telegram.isInTelegram) {
            document.body.classList.add('is-telegram');
        }
        
        const loadTime = this.telegram.isInTelegram ? 1500 : 2500;
        setTimeout(() => {
            this.switchScreen('menu');
        }, loadTime);
        
        this.initMainMenu();
        this.initSizeSelection();
    }
    
    switchScreen(targetScreen) {
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
            }, 300);
        }
    }
    
    initMainMenu() {
        this.loadRecentProjects();
    }
    
    initSizeSelection() {
        const sizeOptions = document.querySelectorAll('.size-option');
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.selectedSize = parseInt(option.dataset.size);
            });
        });
        
        const defaultOption = document.querySelector('.size-option[data-size="16"]');
        if (defaultOption) {
            defaultOption.classList.add('active');
        }
    }
    
    loadRecentProjects() {
        const thumbnailsContainer = document.getElementById('recentProjects');
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        
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
        this.switchScreen('sizeSelection');
    }
    
    confirmSizeSelection() {
        if (!this.selectedSize) {
            this.telegram.showAlert('Пожалуйста, выберите размер сетки');
            return;
        }
        
        this.switchScreen('workspace');
        
        setTimeout(() => {
            this.initWorkspace();
        }, 500);
    }
    
    initWorkspace() {
        const workspace = document.getElementById('pixelArtApp');
        const shareButton = this.telegram.isInTelegram ? 
            `<button class="share-btn" onclick="app.shareProject()" title="Поделиться в Telegram">📤 Поделиться</button>` : '';
        
        workspace.innerHTML = `
            <header class="toolbar">
                <div class="toolbar-left">
                    <button class="back-btn" onclick="app.returnToMenu()">← Назад</button>
                </div>
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
                        <select id="gridSizeSelect" onchange="app.changeGridSize(this.value)">
                            <option value="8">8x8</option>
                            <option value="16" selected>16x16</option>
                            <option value="32">32x32</option>
                            <option value="64">64x64</option>
                        </select>
                    </div>
                    ${shareButton}
                </div>
            </header>
            
            <main class="workspace">
                <div class="canvas-container">
                    <div class="pixel-grid" id="canvas"></div>
                </div>
            </main>
            
            <footer class="status-bar">
                <span>Размер: ${this.selectedSize}x${this.selectedSize}</span>
                <button class="export-btn" onclick="app.exportArtwork()">Экспорт PNG</button>
            </footer>
        `;
        
        const sizeSelect = document.getElementById('gridSizeSelect');
        if (sizeSelect) {
            sizeSelect.value = this.selectedSize;
        }
        
        this.editor = new PixelArtEditor(this.selectedSize);
        
        if (this.telegram.isInTelegram) {
            this.telegram.tg.MainButton.setText('Сохранить в Telegram');
            this.telegram.tg.MainButton.show();
        }
    }
    
    changeGridSize(newSize) {
        if (this.editor) {
            this.editor.changeGridSize(parseInt(newSize));
            const statusBar = document.querySelector('.status-bar span');
            if (statusBar) {
                statusBar.textContent = `Размер: ${newSize}x${newSize}`;
            }
        }
    }
    
    returnToMenu() {
        if (this.editor) {
            this.saveCurrentProject();
        }
        
        if (this.telegram.isInTelegram) {
            this.telegram.tg.MainButton.hide();
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
    }
    
    loadProject() {
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        if (recentProjects.length === 0) {
            this.telegram.showAlert('Нет сохраненных проектов!');
            return;
        }
        
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
                }, 100);
            }
        }, 500);
    }
    
    exportArtwork() {
        if (this.editor) {
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

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PixelArtApp();
});
// В файле app.js добавить:
function initSizeSelection() {
    const sizeOptions = document.querySelectorAll('.size-option');
    let selectedSize = 16; // размер по умолчанию
    
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
    sizeOptions[1].classList.add('active'); // 16x16
    
    return {
        getSelectedSize: () => selectedSize
    };
}
function switchScreen(screenName) {
    // ... существующий код ...
    
    if (screenName === 'workspace') {
        // Даем время на отрисовку DOM перед созданием сетки
        setTimeout(() => {
            refreshGridSize();
        }, 50);
    }
}
// Инициализация при загрузке
const sizeSelector = initSizeSelection();

