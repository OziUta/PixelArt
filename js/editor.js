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
    }
    
    createGrid() {
        const container = document.getElementById('canvas');
        const pixelSize = this.calculatePixelSize();
        
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        container.innerHTML = '';
        
        this.canvas = [];
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = i;
            pixel.style.width = `${pixelSize}px`;
            pixel.style.height = `${pixelSize}px`;
            
            container.appendChild(pixel);
            this.canvas.push({ element: pixel, color: null });
        }
    }
    
    calculatePixelSize() {
        const maxSize = window.telegramApp?.isInTelegram ? 600 : 800;
        return Math.max(4, Math.min(20, Math.floor(maxSize / this.gridSize)));
    }
    
    setupEventListeners() {
        const container = document.getElementById('canvas');
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
        this.gridSize = newSize;
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
            }, 50);
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
// В editor.js добавим функцию для адаптивного размера сетки
function createAdaptiveGrid(size) {
    const grid = document.getElementById('pixelGrid');
    const container = document.querySelector('.canvas-container');
    
    // Очищаем сетку
    grid.innerHTML = '';
    
    // Рассчитываем оптимальный размер пикселя
    const containerWidth = container.clientWidth - 30; // минус padding
    const containerHeight = container.clientHeight - 30;
    
    const pixelSize = Math.min(
        Math.floor(containerWidth / size),
        Math.floor(containerHeight / size)
    );
    
    // Устанавливаем размеры сетки
    grid.style.gridTemplateColumns = `repeat(${size}, ${pixelSize}px)`;
    grid.style.gridTemplateRows = `repeat(${size}, ${pixelSize}px)`;
    
    // Создаем пиксели
    for (let i = 0; i < size * size; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.dataset.index = i;
        grid.appendChild(pixel);
    }
    
    // Обновляем отображаемый размер
    document.getElementById('currentSize').textContent = `${size}×${size}`;
    
    return pixelSize;
}

// Функция для обновления размера при изменении окна
function setupGridResize() {
    let currentSize = 16;
    
    function handleResize() {
        createAdaptiveGrid(currentSize);
    }
    
    // Обновляем сетку при изменении размера окна
    window.addEventListener('resize', handleResize);
    
    return {
        setSize: (size) => {
            currentSize = size;
            createAdaptiveGrid(size);
        }
    };
}

// Инициализация
const gridManager = setupGridResize();

// В app.js обновим функцию подтверждения выбора размера
function confirmSizeSelection() {
    const selectedSize = sizeSelector.getSelectedSize();
    gridManager.setSize(selectedSize);
    switchScreen('workspace');
}
