export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function debounce(func, wait, immediate) {
  let timeout;
  return function (...args) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function hexToRgbA(hex) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2], "F", "F"];
    } else if (c.length === 6) {
      c.push("F", "F");
    }
    c = "0x" + c.join("");
    return [(c >> 24) & 255, (c >> 16) & 255, (c >> 8) & 255, (c & 255) / 255];
  }
  throw new Error("Bad Hex");
}

export function precomputeColors() {
  const BASE_FONT_COLOR_START = "#eeeeeebb";
  const BASE_FONT_COLOR_END = "#ddddddaa";
  const CHOSEN_FONT_COLOR_START = "#f2f2f2dd";
  const CHOSEN_FONT_COLOR_END = "#ffffffff";
  const COLOR_STEPS = 341;

  const colors = [];
  for (let i = 0; i <= COLOR_STEPS; i++) {
    const unlockPercentage = i / COLOR_STEPS;
    const baseFontColor = interpolateColor(
      BASE_FONT_COLOR_START,
      BASE_FONT_COLOR_END,
      unlockPercentage
    );
    const chosenFontColor = interpolateColor(
      CHOSEN_FONT_COLOR_START,
      CHOSEN_FONT_COLOR_END,
      unlockPercentage
    );
    colors[i] = { baseFontColor, chosenFontColor };
  }
  return colors;
}

const precomputedColors = precomputeColors();

export function getPrecomputedColors(index) {
  return precomputedColors[index];
}

export function interpolateColor(startColor, endColor, factor) {
  const start = hexToRgbA(startColor);
  const end = hexToRgbA(endColor);
  const result = start.map((startComponent, index) => {
    if (index < 3) {
      return Math.round(
        startComponent + (end[index] - startComponent) * factor
      );
    } else {
      return parseFloat(
        (startComponent + (end[index] - startComponent) * factor).toFixed(2)
      );
    }
  });
  return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
}

export function generateRandomBorders(cell) {
  cell.style.borderRadius = generateBlobbyBorderRadius();
}

export function generateBlobbyBorderRadius(minPercent = 30, maxPercent = 70) {
  const radii = Array.from(
    { length: 8 },
    () => Math.floor(Math.random() * (maxPercent - minPercent + 1)) + minPercent
  );

  const borderRadiusString = `
      ${radii[0]}% ${100 - radii[0]}% ${100 - radii[1]}% ${radii[1]}% / 
      ${radii[2]}% ${radii[3]}% ${100 - radii[3]}% ${100 - radii[2]}%
    `
    .replace(/\s+/g, " ")
    .trim();

  return borderRadiusString;
}
