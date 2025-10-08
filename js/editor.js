class PixelArtEditor {
    constructor(gridSize = 16) {
        // Ограничиваем возможные размеры сетки
        this.gridSize = gridSize === 32 ? 16 : gridSize;
        this.currentColor = '#ff0000';
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.canvas = [];
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
    }
    
    createGrid() {
        const container = document.getElementById('canvas');
        if (!container) {
            console.error('Canvas container not found');
            return;
        }
        
        const pixelSize = this.calculatePixelSize();
        
        // Очищаем контейнер
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        this.canvas = [];
        
        // Создаем пиксели
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = i;
            
            container.appendChild(pixel);
            this.canvas.push({ element: pixel, color: null });
        }
        
        console.log(`Created ${this.gridSize}x${this.gridSize} grid`);
    }
    
    calculatePixelSize() {
        // Простая логика расчета размера пикселя
        const baseSize = window.innerWidth <= 480 ? 15 : 20;
        return Math.max(8, Math.min(30, Math.floor(baseSize * 16 / this.gridSize)));
    }
    
    setupEventListeners() {
        const container = document.getElementById('canvas');
        if (!container) return;
        
        container.addEventListener('mousedown', (e) => this.startDrawing(e));
        container.addEventListener('mousemove', (e) => this.draw(e));
        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e);
        });
        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e);
        });
        
        document.addEventListener('mouseup', () => this.stopDrawing());
        document.addEventListener('touchend', () => this.stopDrawing());
        
        // Обработчики для инструментов
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tool')) {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
            }
            
            if (e.target.classList.contains('color')) {
                document.querySelectorAll('.color').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.currentColor = e.target.dataset.color;
            }
        });
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        let pixel;
        if (e.type.includes('touch')) {
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('pixel')) {
                pixel = element;
            }
        } else {
            pixel = e.target;
        }
        
        if (pixel && pixel.classList.contains('pixel')) {
            this.applyTool(pixel);
        }
    }
    
    applyTool(pixel) {
        const index = parseInt(pixel.dataset.index);
        
        switch (this.currentTool) {
            case 'brush':
                pixel.style.backgroundColor = this.currentColor;
                this.canvas[index].color = this.currentColor;
                break;
                
            case 'eraser':
                pixel.style.backgroundColor = '';
                this.canvas[index].color = null;
                break;
                
            case 'fill':
                this.floodFill(index);
                break;
        }
    }
    
    floodFill(startIndex) {
        const targetColor = this.canvas[startIndex].color;
        if (targetColor === this.currentColor) return;
        
        const queue = [startIndex];
        const visited = new Set();
        
        while (queue.length > 0) {
            const index = queue.shift();
            if (visited.has(index)) continue;
            
            visited.add(index);
            
            if (this.canvas[index].color === targetColor) {
                this.canvas[index].color = this.currentColor;
                this.canvas[index].element.style.backgroundColor = this.currentColor;
                
                const x = index % this.gridSize;
                const y = Math.floor(index / this.gridSize);
                
                if (x > 0) queue.push(index - 1);
                if (x < this.gridSize - 1) queue.push(index + 1);
                if (y > 0) queue.push(index - this.gridSize);
                if (y < this.gridSize - 1) queue.push(index + this.gridSize);
            }
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    changeGridSize(newSize) {
        // Ограничиваем возможные размеры
        const allowedSizes = [8, 16];
        const finalSize = allowedSizes.includes(parseInt(newSize)) ? parseInt(newSize) : 16;
        
        this.gridSize = finalSize;
        this.createGrid();
        this.setupEventListeners();
    }
    
    exportAsPNG() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = Math.max(2, Math.floor(512 / this.gridSize));
        
        canvas.width = this.gridSize * scale;
        canvas.height = this.gridSize * scale;
        
        this.canvas.forEach((pixelData, index) => {
            const x = (index % this.gridSize) * scale;
            const y = Math.floor(index / this.gridSize) * scale;
            
            if (pixelData.color) {
                ctx.fillStyle = pixelData.color;
            } else {
                ctx.fillStyle = '#2d2d2d';
            }
            
            ctx.fillRect(x, y, scale, scale);
        });
        
        // Всегда используем улучшенное скачивание
        this.enhancedDownload(canvas);
    }
    
    enhancedDownload(canvas) {
        const imageDataUrl = canvas.toDataURL('image/png');
        const filename = `pixel-art-${this.gridSize}x${this.gridSize}-${Date.now()}.png`;
        
        // Создаем временное окно с изображением
        this.createDownloadWindow(imageDataUrl, filename);
    }

    createDownloadWindow(imageDataUrl, filename) {
        // Создаем новое окно с изображением
        const downloadWindow = window.open('', '_blank');
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Скачать пиксель-арт</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                        color: white;
                    }
                    .container {
                        background: rgba(255,255,255,0.95);
                        padding: 30px;
                        border-radius: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        max-width: 90%;
                        color: #333;
                    }
                    h1 {
                        color: #2c3e50;
                        margin-bottom: 20px;
                        font-size: 1.5rem;
                    }
                    .image-preview {
                        max-width: 300px;
                        max-height: 300px;
                        border: 3px solid #3498db;
                        border-radius: 10px;
                        margin: 20px 0;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    .instruction {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 10px;
                        margin: 15px 0;
                        border-left: 4px solid #27ae60;
                        text-align: left;
                    }
                    .instruction ol {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .instruction li {
                        margin-bottom: 8px;
                        line-height: 1.4;
                    }
                    .download-btn {
                        display: inline-block;
                        background: #27ae60;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 10px;
                        text-decoration: none;
                        font-size: 1.2rem;
                        font-weight: bold;
                        margin: 15px 0;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
                        border: none;
                        cursor: pointer;
                    }
                    .download-btn:hover {
                        background: #219a52;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
                    }
                    .close-btn {
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                        transition: all 0.3s ease;
                    }
                    .close-btn:hover {
                        background: #c0392b;
                    }
                    @media (max-width: 480px) {
                        .container {
                            padding: 20px 15px;
                        }
                        h1 {
                            font-size: 1.3rem;
                        }
                        .image-preview {
                            max-width: 250px;
                        }
                        .download-btn {
                            padding: 12px 25px;
                            font-size: 1.1rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎨 Ваш пиксель-арт готов!</h1>
                    
                    <img src="${imageDataUrl}" alt="Pixel Art" class="image-preview">
                    
                    <div class="instruction">
                        <strong>Как сохранить изображение:</strong>
                        <ol>
                            <li>Нажмите и удерживайте изображение выше</li>
                            <li>В появившемся меню выберите "Скачать" или "Сохранить изображение"</li>
                            <li>Изображение сохранится в галерею вашего телефона</li>
                        </ol>
                    </div>
                    
                    <a href="${imageDataUrl}" download="${filename}" class="download-btn">
                        📥 Скачать PNG
                    </a>
                    
                    <br>
                    <button class="close-btn" onclick="window.close()">Закрыть окно</button>
                </div>
                
                <script>
                    // Автоматически пытаемся скачать при загрузке страницы
                    setTimeout(() => {
                        const downloadLink = document.querySelector('.download-btn');
                        if (downloadLink) {
                            downloadLink.click();
                        }
                    }, 500);
                    
                    // Также добавляем возможность ручного скачивания при клике на изображение
                    document.querySelector('.image-preview').addEventListener('click', function() {
                        const tempLink = document.createElement('a');
                        tempLink.href = '${imageDataUrl}';
                        tempLink.download = '${filename}';
                        tempLink.click();
                    });
                </script>
            </body>
            </html>
        `;
        
        if (downloadWindow) {
            downloadWindow.document.write(htmlContent);
            downloadWindow.document.close();
            
            // Показываем сообщение в основном приложении
            if (window.telegramApp) {
                window.telegramApp.showAlert(
                    '📸 Открылось окно для скачивания!\n\n' +
                    'Если окно не открылось автоматически:\n' +
                    '1. Проверьте блокировку всплывающих окон\n' +
                    '2. Нажмите на изображение в основном окне\n' +
                    '3. Выберите "Скачать" из меню'
                );
            }
        } else {
            // Если новое окно заблокировано, показываем изображение в основном окне
            this.showImageInMainWindow(imageDataUrl, filename);
        }
    }

    showImageInMainWindow(imageDataUrl, filename) {
        // Создаем overlay в основном окне
        const overlay = document.createElement('div');
        overlay.className = 'download-overlay';
        overlay.innerHTML = `
            <div class="download-container">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">📸 Ваш пиксель-арт</h2>
                
                <img src="${imageDataUrl}" alt="Pixel Art" style="
                    max-width: 300px;
                    max-height: 300px;
                    border: 3px solid #3498db;
                    border-radius: 10px;
                    margin: 15px 0;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                ">
                
                <div style="
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    border-left: 4px solid #27ae60;
                    text-align: left;
                    color: var(--text-primary);
                ">
                    <strong>Инструкция по сохранению:</strong><br>
                    1. Нажмите и удерживайте изображение<br>
                    2. Выберите "Скачать" или "Сохранить"<br>
                    3. Изображение сохранится в галерею
                </div>
                
                <a href="${imageDataUrl}" download="${filename}" style="
                    display: inline-block;
                    background: #27ae60;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    margin: 10px 0;
                ">📥 Попробовать скачать</a>
                
                <br>
                <button onclick="this.closest('.download-overlay').remove()" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    margin-top: 10px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>
        `;
        
        // Добавляем обработчик клика на изображение
        const img = overlay.querySelector('img');
        img.style.cursor = 'pointer';
        img.title = 'Нажмите и удерживайте для сохранения';
        
        document.body.appendChild(overlay);
        
        // Автоматически пытаемся скачать
        setTimeout(() => {
            const downloadLink = overlay.querySelector('a');
            if (downloadLink) {
                downloadLink.click();
            }
        }, 1000);
        
        // Закрытие по клику на overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    getProjectData() {
        return {
            pixels: this.canvas.map(pixel => pixel.color),
            gridSize: this.gridSize
        };
    }
    
    loadProject(data) {
        if (data && data.pixels) {
            if (data.gridSize && data.gridSize !== this.gridSize) {
                this.changeGridSize(data.gridSize);
            }
            
            setTimeout(() => {
                data.pixels.forEach((color, index) => {
                    if (index < this.canvas.length && this.canvas[index]) {
                        this.canvas[index].color = color;
                        if (this.canvas[index].element) {
                            this.canvas[index].element.style.backgroundColor = color;
                        }
                    }
                });
            }, 100);
        }
    }
    
    getUsedColors() {
        const colors = new Set();
        this.canvas.forEach(pixel => {
            if (pixel.color) {
                colors.add(pixel.color);
            }
        });
        return Array.from(colors).slice(0, 2);
    }
    
    generateThumbnail() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2;
        
        canvas.width = this.gridSize * scale;
        canvas.height = this.gridSize * scale;
        
        this.canvas.forEach((pixelData, index) => {
            const x = (index % this.gridSize) * scale;
            const y = Math.floor(index / this.gridSize) * scale;
            
            if (pixelData.color) {
                ctx.fillStyle = pixelData.color;
            } else {
                ctx.fillStyle = '#2d2d2d';
            }
            
            ctx.fillRect(x, y, scale, scale);
        });
        
        return canvas.toDataURL();
    }
}
