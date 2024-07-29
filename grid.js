import { generateRandomBorders, randomIntFromInterval } from "./utils.js";
import * as CONSTANTS from "./constants.js";

export function createAllGridCells(gameGrid, maxCells) {
  const fragment = document.createDocumentFragment();
  for (let cellIndex = 0; cellIndex < maxCells; cellIndex++) {
    const cell = createGridCell();
    fragment.appendChild(cell);
  }
  gameGrid.appendChild(fragment);
}

export function createGridCell() {
  const cell = document.createElement("div");
  cell.classList.add("grid-cell", "not-in-use");
  generateRandomBorders(cell);
  const charElement = document.createElement("div");
  charElement.classList.add("grid-char");
  cell.appendChild(charElement);
  cell.addEventListener("focus", () => {
    if (
      cell.classList.contains("correct") ||
      cell.classList.contains("incorrect")
    ) {
      cell.classList.add("focused");
    }
  });
  cell.addEventListener("focusout", () => {
    cell.classList.remove("hide-focus-visuals");
    cell.classList.remove("focused");
  });

  return cell;
}

export function updateGridVisibility(rows, cols, gameGrid) {
  const totalCells = rows * cols;
  const cells = gameGrid.querySelectorAll(".grid-cell");
  cells.forEach((cell, index) => {
    if (index < totalCells) {
      cell.classList.add("in-use");
      cell.classList.remove("not-in-use");
      cell.tabIndex = 0;
    } else {
      cell.classList.remove("in-use");
      cell.classList.add("not-in-use");
      cell.tabIndex = -1;
    }
  });
}

export function adjustGrid(rows, cols, gameGrid) {
  gameGrid.style.setProperty("--grid-rows", rows);
  gameGrid.style.setProperty("--grid-cols", cols);

  const cells = document.querySelectorAll(".grid-cell");
  cells.forEach((cell) => {
    cell.style.fontSize = getRandomFontSize(rows, cols);
  });
}

export function populateGridCells(targetCharacters, characterPool, gameGrid) {
  const cells = gameGrid.querySelectorAll(".grid-cell.in-use");
  let matchingPicks = 0;

  cells.forEach((cell) => {
    cell.classList.remove("chosen", "correct", "incorrect");
    const unicodeChar = getLinearChar(characterPool);
    const charElement = cell.querySelector(".grid-char");
    charElement.textContent = String.fromCodePoint(unicodeChar);
    cell.style.fontSize = getRandomFontSize(
      gameGrid.style.getPropertyValue("--grid-rows"),
      gameGrid.style.getPropertyValue("--grid-cols")
    );
    charElement.style.animation = generateRandomAnimations();

    if (targetCharacters.includes(unicodeChar)) {
      cell.classList.add("chosen");
      matchingPicks++;
    }

    void cell.offsetWidth;
  });

  return matchingPicks;
}

function getRandomFontSize(rows, cols) {
  const baseFontSize = 10 / Math.min(rows, cols);
  const randomFontSizeVh = baseFontSize + Math.random() * baseFontSize;
  const randomFontSizeVw = baseFontSize + Math.random() * baseFontSize;
  return `calc(${randomFontSizeVh}vh + ${randomFontSizeVw}vw)`;
}

function getLinearChar(characterPool) {
  return characterPool[Math.floor(Math.random() * characterPool.length)];
}

function generateRandomAnimations() {
  const randomDuration = () =>
    `${10 * Math.random() + randomIntFromInterval(10, 60)}s`;
  const randomDelay = () => `${Math.random() * -3}s`;

  return `${randomDuration()} rotateCharacter ease-in-out infinite alternate ${randomDelay()}, 
            ${randomDuration()} horizontalCharacterMovement ease-in-out infinite alternate ${randomDelay()}, 
            ${randomDuration()} verticalCharacterMovement ease-in-out infinite alternate ${randomDelay()}, 
            ${randomDuration()} pulseCharacter ease-in-out infinite alternate ${randomDelay()}`;
}

export function applyAnimationMultiplier(rows, cols) {
  const maxGridSize = CONSTANTS.GRID_MAX_ROWS * CONSTANTS.GRID_MAX_COLS;
  const currentGridSize = rows * cols;
  const multiplier = 2.75 - (2.75 - 1) * (currentGridSize / maxGridSize);
  document.documentElement.style.setProperty(
    "--animation-multiplier",
    multiplier
  );
}
