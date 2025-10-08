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
        
        // Создаем видимую ссылку для скачивания
        const downloadLink = document.createElement('a');
        downloadLink.href = imageDataUrl;
        downloadLink.download = filename;
        downloadLink.textContent = 'Скачать PNG файл';
        downloadLink.style.cssText = `
            display: block;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-decoration: none;
            font-size: 1.2rem;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            text-align: center;
            min-width: 200px;
        `;
        
        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Создаем контейнер для ссылки и инструкции
        const downloadContainer = document.createElement('div');
        downloadContainer.style.cssText = `
            background: var(--bg-primary);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            max-width: 90%;
            box-shadow: 0 5px 25px rgba(0,0,0,0.5);
        `;
        
        const instruction = document.createElement('div');
        instruction.style.cssText = `
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 0.9rem;
            line-height: 1.4;
        `;
        instruction.innerHTML = `
            <strong>Инструкция по скачиванию:</strong><br>
            1. Нажмите на зеленую кнопку ниже<br>
            2. Удерживайте появившуюся ссылку<br>
            3. Выберите "Скачать" или "Сохранить"<br>
            4. Изображение сохранится в галерею
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Закрыть';
        closeBtn.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
        `;
        closeBtn.onclick = () => {
            document.body.removeChild(overlay);
        };
        
        // Собираем всё вместе
        downloadContainer.appendChild(instruction);
        downloadContainer.appendChild(downloadLink);
        downloadContainer.appendChild(closeBtn);
        overlay.appendChild(downloadContainer);
        document.body.appendChild(overlay);
        
        // Автоматически нажимаем на ссылку через небольшой промежуток времени
        setTimeout(() => {
            downloadLink.click();
        }, 500);
        
        // Также добавляем обработчик ручного нажатия
        downloadLink.onclick = (e) => {
            e.preventDefault();
            // Создаем временную ссылку для прямого скачивания
            const tempLink = document.createElement('a');
            tempLink.href = imageDataUrl;
            tempLink.download = filename;
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
        };
        
        // Убираем overlay при клике на него
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
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
