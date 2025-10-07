class PixelArtEditor {
    constructor(gridSize = 16) {
        this.gridSize = gridSize;
        this.currentColor = '#ff0000';
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.canvas = [];
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.setupResizeHandler();
    }
    
    createGrid() {
        const container = document.getElementById('canvas');
        const pixelSize = this.calculatePixelSize();
        
        // Очищаем контейнер
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        container.style.width = `${this.gridSize * pixelSize}px`;
        container.style.height = `${this.gridSize * pixelSize}px`;
        
        this.canvas = [];
        
        // Создаем пиксели
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = i;
            pixel.style.width = `${pixelSize}px`;
            pixel.style.height = `${pixelSize}px`;
            pixel.style.minWidth = `${pixelSize}px`;
            pixel.style.minHeight = `${pixelSize}px`;
            
            container.appendChild(pixel);
            this.canvas.push({ element: pixel, color: null });
        }
        
        console.log(`Created ${this.gridSize}x${this.gridSize} grid, pixel size: ${pixelSize}px, total width: ${this.gridSize * pixelSize}px`);
    }
    
    calculatePixelSize() {
        // Получаем размеры workspace
        const workspace = document.querySelector('.workspace');
        const canvasContainer = document.querySelector('.canvas-container');
        
        if (!workspace || !canvasContainer) return 20;
        
        const workspaceWidth = workspace.clientWidth - 40; // учитываем padding
        const workspaceHeight = workspace.clientHeight - 40;
        const containerWidth = canvasContainer.clientWidth - 40; // учитываем padding контейнера
        
        // Вычисляем доступную ширину (берем минимальную из workspace и container)
        const availableWidth = Math.min(workspaceWidth, containerWidth);
        
        // Вычисляем размер пикселя на основе доступной ширины
        let pixelSize = Math.floor(availableWidth / this.gridSize);
        
        // Для маленьких экранов делаем пиксели меньше
        if (window.innerWidth <= 480) {
            pixelSize = Math.max(8, pixelSize); // минимальный размер для мобильных
        } else {
            pixelSize = Math.max(12, pixelSize); // минимальный размер для десктопа
        }
        
        // Максимальный размер пикселя
        pixelSize = Math.min(30, pixelSize);
        
        console.log(`Available width: ${availableWidth}px, Grid: ${this.gridSize}, Pixel size: ${pixelSize}px`);
        return pixelSize;
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.gridSize) {
                    this.createGrid();
                }
            }, 250);
        });
    }
    
    setupEventListeners() {
        const container = document.getElementById('canvas');
        if (!container) return;
        
        // Удаляем старые обработчики
        container.replaceWith(container.cloneNode(true));
        const newContainer = document.getElementById('canvas');
        
        newContainer.addEventListener('mousedown', (e) => this.startDrawing(e));
        newContainer.addEventListener('mousemove', (e) => this.draw(e));
        newContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e);
        });
        newContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e);
        });
        
        document.addEventListener('mouseup', () => this.stopDrawing());
        document.addEventListener('touchend', () => this.stopDrawing());
        
        const tools = document.querySelectorAll('.tool');
        tools.forEach(tool => {
            tool.addEventListener('click', (e) => {
                tools.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
            });
        });
        
        const colors = document.querySelectorAll('.color');
        colors.forEach(color => {
            color.addEventListener('click', (e) => {
                colors.forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.currentColor = e.target.dataset.color;
            });
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
        this.gridSize = parseInt(newSize);
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
                    if (index < this.canvas.length) {
                        this.canvas[index].color = color;
                        this.canvas[index].element.style.backgroundColor = color;
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
