function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


function hexToRgbA(hex) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2], 'F', 'F']; // Expand shorthand to full form and add default alpha
        } else if (c.length === 6) {
            c.push('F', 'F'); // Add default alpha if not present
        }
        c = '0x' + c.join('');
        return [(c >> 24) & 255, (c >> 16) & 255, (c >> 8) & 255, (c & 255) / 255];
    }
    throw new Error('Bad Hex');
}

function precomputeColors() {
    const BASE_FONT_COLOR_START = "#eeeeeebb";
    const BASE_FONT_COLOR_END = "#ddddddaa";
    const CHOSEN_FONT_COLOR_START = "#f2f2f2dd";
    const CHOSEN_FONT_COLOR_END = "#ffffffff";

    const colors = [];
    for (let i = 0; i <= 341; i++) {
        const unlockPercentage = i / 341;
        const baseFontColor = interpolateColor(BASE_FONT_COLOR_START, BASE_FONT_COLOR_END, unlockPercentage);
        const chosenFontColor = interpolateColor(CHOSEN_FONT_COLOR_START, CHOSEN_FONT_COLOR_END, unlockPercentage);
        colors[i] = { baseFontColor, chosenFontColor };
    }
    return colors;
}

const precomputedColors = precomputeColors();

function getPrecomputedColors(index) {
    return precomputedColors[index];
}


function interpolateColor(startColor, endColor, factor) {
    const start = hexToRgbA(startColor);
    const end = hexToRgbA(endColor);
    const result = start.map((startComponent, index) => {
        if (index < 3) { // R, G, B
            return Math.round(startComponent + (end[index] - startComponent) * factor);
        } else { // A
            return parseFloat((startComponent + (end[index] - startComponent) * factor).toFixed(2));
        }
    });
    return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
}


function debounce(func, wait, immediate) {
    let timeout;
    return function(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}


function generateRandomBorders(cell) {
    cell.style.borderRadius = generateBlobbyBorderRadius();
}


function generateBlobbyBorderRadius(minPercent = 30, maxPercent = 70) {
    // Generate 8 random percentages for the 4 corners (horizontal and vertical for each)
    const radii = Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * (maxPercent - minPercent + 1)) + minPercent
    );
  
    // Construct the border-radius string
    const borderRadiusString = `
      ${radii[0]}% ${100 - radii[0]}% ${100 - radii[1]}% ${radii[1]}% / 
      ${radii[2]}% ${radii[3]}% ${100 - radii[3]}% ${100 - radii[2]}%
    `.replace(/\s+/g, ' ').trim();
  
    return borderRadiusString;
  }
  