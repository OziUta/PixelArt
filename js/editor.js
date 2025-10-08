class PixelArtEditor {
    constructor(gridSize = 16) {
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
        
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        this.canvas = [];
        
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
        
        this.showDownloadModal(canvas);
    }
    
    showDownloadModal(canvas) {
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // Создаем простое модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                border: 2px solid #333;
                color: white;
            ">
                <h2 style="margin-bottom: 20px; color: #fff;">🎨 Ваш пиксель-арт готов!</h2>
                
                <div style="
                    background: #2d2d2d;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    border-left: 4px solid #27ae60;
                    text-align: left;
                ">
                    <strong>📱 Как сохранить на телефон:</strong>
                    <div style="margin-top: 10px; line-height: 1.5;">
                        1. <strong>Нажмите и удерживайте</strong> изображение ниже<br>
                        2. В меню выберите <strong>"Сохранить изображение"</strong><br>
                        3. Или <strong>"Скачать"</strong><br>
                        4. Изображение сохранится в <strong>галерею</strong>
                    </div>
                </div>
                
                <img src="${imageDataUrl}" alt="Ваш пиксель-арт" style="
                    max-width: 300px;
                    max-height: 300px;
                    border: 3px solid #3498db;
                    border-radius: 10px;
                    margin: 15px 0;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                ">
                
                <div style="margin-top: 20px;">
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 1rem;
                        cursor: pointer;
                        margin: 5px;
                    ">Понятно</button>
                    
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 1rem;
                        cursor: pointer;
                        margin: 5px;
                    ">Закрыть</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Показываем сообщение в Telegram
        if (window.telegramApp) {
            window.telegramApp.showAlert(
                '📸 Изображение готово!\n\n' +
                'Нажмите и удерживайте картинку в открывшемся окне, чтобы сохранить её в галерею.'
            );
        }
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
