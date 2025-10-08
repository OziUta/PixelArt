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
        
        // Всегда используем улучшенное скачивание для Telegram
        if (window.telegramApp && window.telegramApp.isInTelegram) {
            this.downloadInTelegram(canvas);
        } else {
            this.downloadInBrowser(canvas);
        }
    }
    
    downloadInBrowser(canvas) {
        const link = document.createElement('a');
        link.download = `pixel-art-${this.gridSize}x${this.gridSize}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        if (window.telegramApp) {
            window.telegramApp.showAlert(`Рисунок ${this.gridSize}x${this.gridSize} экспортирован как PNG! 🎉`);
        } else {
            alert(`Рисунок ${this.gridSize}x${this.gridSize} экспортирован как PNG! 🎉`);
        }
    }
    
    // Улучшенное скачивание для Telegram
    downloadInTelegram(canvas) {
        const imageDataUrl = canvas.toDataURL('image/png');
        const filename = `pixel-art-${this.gridSize}x${this.gridSize}-${Date.now()}.png`;
        
        // Создаем временную ссылку для скачивания
        const downloadLink = document.createElement('a');
        downloadLink.href = imageDataUrl;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Добавляем ссылку в DOM
        document.body.appendChild(downloadLink);
        
        // Показываем подробную инструкцию
        if (window.telegramApp) {
            window.telegramApp.showAlert(
                `📸 Ваш рисунок ${this.gridSize}x${this.gridSize} готов!\n\n` +
                'Инструкция по сохранению:\n\n' +
                '1. Нажмите ОК в этом окне\n' +
                '2. Появится ссылка для скачивания\n' +
                '3. Нажмите и удерживайте ссылку\n' +
                '4. Выберите "Скачать" или "Сохранить изображение"\n\n' +
                'После сохранения изображение будет в вашей галерее! 📱'
            );
            
            // Автоматически нажимаем на ссылку после закрытия alert
            setTimeout(() => {
                downloadLink.click();
                
                // Показываем финальное сообщение
                setTimeout(() => {
                    window.telegramApp.showAlert(
                        '✅ Отлично! Если изображение не сохранилось:\n\n' +
                        '• Проверьте уведомления\n' +
                        '• Или попробуйте нажать на ссылку еще раз\n' +
                        '• Изображение сохранится в галерею телефона'
                    );
                    
                    // Убираем ссылку через некоторое время
                    setTimeout(() => {
                        if (document.body.contains(downloadLink)) {
                            document.body.removeChild(downloadLink);
                        }
                    }, 10000);
                }, 1000);
            }, 1500);
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
