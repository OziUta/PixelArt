// editor.js - управление пиксельной сеткой и редактором
let currentGridSize = 16;
let currentColor = '#3390ec';
let isDrawing = false;
let currentTool = 'pencil';

// Цветовая палитра
const colorPalette = [
    '#3390ec', '#27ae60', '#e74c3c', '#f39c12', 
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
    '#ffffff', '#000000', '#95a5a6', '#d35400'
];

function initEditor() {
    createColorPalette();
    setupEventListeners();
    createAdaptiveGrid(currentGridSize);
}

function createColorPalette() {
    const paletteContainer = document.querySelector('.color-palette');
    if (!paletteContainer) return;
    
    paletteContainer.innerHTML = '';
    
    colorPalette.forEach(color => {
        const colorElement = document.createElement('div');
        colorElement.className = `color ${color === currentColor ? 'active' : ''}`;
        colorElement.style.backgroundColor = color;
        colorElement.dataset.color = color;
        colorElement.addEventListener('click', () => selectColor(color));
        paletteContainer.appendChild(colorElement);
    });
}

function selectColor(color) {
    currentColor = color;
    
    // Обновляем активный цвет в палитре
    document.querySelectorAll('.color').forEach(el => {
        el.classList.toggle('active', el.dataset.color === color);
    });
}

function setupEventListeners() {
    // Обработчики для инструментов
    document.querySelectorAll('.tool').forEach(tool => {
        tool.addEventListener('click', function() {
            selectTool(this.dataset.tool);
        });
    });
    
    // Обработчики для сетки
    document.addEventListener('mouseup', stopDrawing);
    document.addEventListener('touchend', stopDrawing);
}

function selectTool(tool) {
    currentTool = tool;
    
    // Обновляем активный инструмент
    document.querySelectorAll('.tool').forEach(el => {
        el.classList.toggle('active', el.dataset.tool === tool);
    });
}

function startDrawing(e) {
    if (e.target.classList.contains('pixel')) {
        isDrawing = true;
        drawPixel(e.target);
        
        // Предотвращаем скролл на мобильных
        if (e.type === 'touchstart') {
            e.preventDefault();
        }
    }
}

function stopDrawing() {
    isDrawing = false;
}

function drawPixel(pixel) {
    if (!isDrawing && currentTool !== 'pencil') return;
    
    switch (currentTool) {
        case 'pencil':
            pixel.style.backgroundColor = currentColor;
            pixel.classList.add('filled');
            break;
        case 'eraser':
            pixel.style.backgroundColor = '';
            pixel.classList.remove('filled');
            break;
        case 'fill':
            // TODO: Реализовать заливку
            pixel.style.backgroundColor = currentColor;
            pixel.classList.add('filled');
            break;
    }
}

function createAdaptiveGrid(size) {
    currentGridSize = size;
    const grid = document.getElementById('pixelGrid');
    const wrapper = document.querySelector('.canvas-wrapper');
    
    if (!grid || !wrapper) {
        console.error('Grid elements not found');
        return;
    }
    
    // Очищаем сетку
    grid.innerHTML = '';
    
    // Получаем доступные размеры (учитываем padding wrapper)
    const availableWidth = wrapper.clientWidth - 40; // 20px padding с каждой стороны
    const availableHeight = wrapper.clientHeight - 40;
    
    // Рассчитываем оптимальный размер пикселя
    const pixelSize = Math.floor(Math.min(
        availableWidth / size,
        availableHeight / size
    ));
    
    const finalPixelSize = Math.max(3, pixelSize); // Минимальный размер 3px
    
    // Устанавливаем размеры сетки
    grid.style.gridTemplateColumns = `repeat(${size}, ${finalPixelSize}px)`;
    grid.style.gridTemplateRows = `repeat(${size}, ${finalPixelSize}px)`;
    
    // Создаем пиксели
    for (let i = 0; i < size * size; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.dataset.index = i;
        
        // Добавляем обработчики событий
        pixel.addEventListener('mousedown', () => {
            isDrawing = true;
            drawPixel(pixel);
        });
        
        pixel.addEventListener('mouseenter', () => {
            if (isDrawing) {
                drawPixel(pixel);
            }
        });
        
        pixel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
            drawPixel(pixel);
        });
        
        pixel.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('pixel')) {
                drawPixel(element);
            }
        });
        
        grid.appendChild(pixel);
    }
    
    // Обновляем отображаемый размер
    updateCurrentSize(size);
    
    console.log(`Grid created: ${size}x${size}, pixel size: ${finalPixelSize}px, available: ${availableWidth}x${availableHeight}`);
    return finalPixelSize;
}

function updateCurrentSize(size) {
    const currentSizeElement = document.getElementById('currentSize');
    if (currentSizeElement) {
        currentSizeElement.textContent = `${size}×${size}`;
    }
}

function refreshGridSize() {
    if (currentGridSize) {
        createAdaptiveGrid(currentGridSize);
    }
}

function exportImage() {
    const grid = document.getElementById('pixelGrid');
    if (!grid) return;
    
    const canvas = document.createElement('canvas');
    const size = currentGridSize;
    const pixelSize = 10; // Размер пикселя в экспортируемом изображении
    
    canvas.width = size * pixelSize;
    canvas.height = size * pixelSize;
    const ctx = canvas.getContext('2d');
    
    // Заливаем фон
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем пиксели
    for (let i = 0; i < size * size; i++) {
        const pixel = grid.children[i];
        const row = Math.floor(i / size);
        const col = i % size;
        
        if (pixel.style.backgroundColor) {
            ctx.fillStyle = pixel.style.backgroundColor;
            ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.download = `pixel-art-${size}x${size}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function saveToTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        exportImage(); // Пока просто экспортируем
        // TODO: Интеграция с Telegram для сохранения
    } else {
        exportImage();
    }
}

// Обработчики событий
window.addEventListener('resize', refreshGridSize);
window.addEventListener('orientationchange', function() {
    setTimeout(refreshGridSize, 100);
});

// Инициализация редактора при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем когда DOM готов
    setTimeout(initEditor, 100);
});

// Экспортируем функции для использования в app.js
window.editor = {
    setGridSize: createAdaptiveGrid,
    refreshGrid: refreshGridSize,
    exportImage: exportImage,
    saveToTelegram: saveToTelegram
};
