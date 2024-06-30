document.addEventListener("DOMContentLoaded", () => {
    initializeCharacterPool();
    createGrid(1, 1); // Start with a 1x1 grid
    const timer = document.getElementById("timer");
    timer.onanimationiteration = startGame;
    startGame();  // Initial call to start the game

    window.addEventListener('resize', adjustGrid);
    adjustGrid();  // Initial adjustment
    updateScore(0);
});

const VALID_RANGES = [
    [67072, 67382], // U+10600 to U+106AE (Linear A)
    [67392, 67413], // U+106B0 to U+106CD (Linear A)
    [67424, 67431]  // U+106D8 to U+106DF (Linear A)
];

let characterPool = [];
let availableCharacters = [];
let score = 0;
let matchingPicks = 0;
let correctPicks = 0;
let rows, cols = 1;

const totalValidCharacters = calculateTotalValidCharacters();

function calculateTotalValidCharacters() {
    let total = 0;
    VALID_RANGES.forEach(range => {
        total += (range[1] - range[0] + 1);
    });
    return total;
}

function startGame() {
    const specialCount = 4;
    const startButton = document.getElementById("start");

    if (matchingPicks > 0) {
        if (correctPicks === matchingPicks) {
            updateScore(1);
        } else if (correctPicks === 0) {
            updateScore(-1);
        }
    }

    let tempCharacterPool = shuffleArray([...characterPool]);
    const specialOnes = tempCharacterPool.slice(0, specialCount);

    startButton.innerHTML = specialOnes.map(codePoint => String.fromCodePoint(codePoint)).join("&nbsp;");
    startButton.style.fontFamily = "Noto Sans Linear A";

    matchingPicks = 0;
    correctPicks = 0;

    calculateGridSize(score);
    createGrid(rows, cols);
    adjustGrid();
    initializeCells(specialOnes);
    updateAnswerNumber(correctPicks, matchingPicks);
}


function initializeCharacterPool() {
    VALID_RANGES.forEach(range => {
        for (let i = range[0]; i <= range[1]; i++) {
            availableCharacters.push(i);
        }
    });
    availableCharacters = shuffleArray(availableCharacters);
    const initialPoolSize = Math.ceil(availableCharacters.length * 0.01);
    characterPool = availableCharacters.splice(0, initialPoolSize);
    updateUnlockedPercentage();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function adjustCharacterPool(change) {
    if (change > 0 && availableCharacters.length > 0) {
        const addCount = Math.min(change, availableCharacters.length);
        characterPool = characterPool.concat(availableCharacters.splice(0, addCount));
    } else if (change < 0 && characterPool.length > 0) {
        const removeCount = Math.min(Math.abs(change), characterPool.length);
        const removedChars = characterPool.splice(0, removeCount);
        availableCharacters = availableCharacters.concat(removedChars);
    }
    updateUnlockedPercentage();
}

function updateUnlockedPercentage() {
    const percentage = (characterPool.length / totalValidCharacters) * 100;
    document.getElementById("unlockedPercentage").textContent = `(${percentage.toFixed(2)}%)`;
}

function getLinearChar() {
    return characterPool[Math.floor(Math.random() * characterPool.length)];
}

function createGrid(rows, cols) {
    const gameGrid = document.getElementById('gameGrid');
    const currentCells = gameGrid.children.length;
    const totalCells = rows * cols;

    if (currentCells < totalCells) {
        for (let i = currentCells; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('gridCell');
            const char = document.createElement('div');
            char.classList.add('gridChar');
            cell.appendChild(char);
            gameGrid.appendChild(cell);
        }
        addGridEventListeners(currentCells, totalCells);
    } else if (currentCells > totalCells) {
        for (let i = currentCells - 1; i >= totalCells; i--) {
            gameGrid.removeChild(gameGrid.children[i]);
        }
    }
}

function addGridEventListeners(startIndex, endIndex) {
    const cells = document.querySelectorAll(".gridCell");
    for (let i = startIndex; i < endIndex; i++) {
        cells[i].addEventListener("click", () => gridClick(i));
    }
}

function gridClick(i) {
    const cells = document.querySelectorAll(".gridCell");
    if (cells[i].classList.contains("correct") || cells[i].classList.contains("incorrect")) {
        return;
    }

    if (cells[i].classList.contains("chosen")) {
        cells[i].classList.add("correct");
        updateScore(1);
        correctPicks += 1;
        updateAnswerNumber(correctPicks, matchingPicks);
    } else {
        cells[i].classList.add("incorrect");
        updateScore(-1);
    }
}




function calculateGridSize(score) {
    if (score < 64) {
        const gridSize = Math.ceil(Math.sqrt(score + 1));
        rows = gridSize;
        cols = gridSize;
    } else {
        rows = 8;
        cols = Math.min(15, Math.floor(score / 8) + 1);
    }
}


function initializeCells(specialOnes) {
    const cells = document.querySelectorAll(".gridCell");
    cells.forEach(cell => {
        cell.classList.remove("chosen", "correct", "incorrect");
        const char = getLinearChar();
        cell.querySelector(".gridChar").textContent = String.fromCodePoint(char);
        cell.style.fontSize = getRandomFontSize();
        cell.style.color = "#eeeeeebb";
        cell.querySelector(".gridChar").style.animation = generateRandomAnimations();

        if (specialOnes.includes(char)) {
            cell.style.color = "#f2f2f2dd";
            cell.classList.add("chosen");
            matchingPicks += 1;
        }
    });
}


function updateAnswerNumber(count, total) {
    const answerNumber = document.getElementById("answerNumber");
    const remainingMatches = total - count;
    if (remainingMatches === 0) {
        answerNumber.textContent = "All matches found!";
    } else if (remainingMatches === 1) {
        answerNumber.textContent = "1 match remaining.";
    } else {
        answerNumber.textContent = `${remainingMatches} matches remaining.`;
    }
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateRandomAnimations() {
    const randomDuration = () => `${10 * Math.random() + randomIntFromInterval(10, 60)}s`;
    const randomDelay = () => `${Math.random() * -3}s`;

    return `${randomDuration()} wiggle ease-in-out infinite alternate ${randomDelay()}, ${randomDuration()} hori ease-in-out infinite alternate ${randomDelay()}, ${randomDuration()} vert ease-in-out infinite alternate ${randomDelay()}, ${randomDuration()} pulse ease-in-out infinite alternate ${randomDelay()}`;
}

function getRandomFontSize() {
    const baseFontSize = 10 / Math.max(rows, cols);
    const randomFontSizeVh = baseFontSize + Math.random() * baseFontSize;
    const randomFontSizeVw = baseFontSize + Math.random() * baseFontSize;
    return `calc(${randomFontSizeVh}vh + ${randomFontSizeVw}vw)`;
}



function adjustGrid() {
    const gameGrid = document.getElementById('gameGrid');
    calculateGridSize(score);
    gameGrid.style.setProperty('--grid-rows', rows);
    gameGrid.style.setProperty('--grid-cols', cols);

    const cells = document.querySelectorAll(".gridCell");
    cells.forEach(cell => {
        cell.style.fontSize = getRandomFontSize();
    });
}



function updateScore(change) {
    const newScore = Math.max(0, score + change);
    const scoreElement = document.getElementById("score");
    scoreElement.textContent = newScore;

    if (newScore != score) {
        const pulseClass = change > 0 ? 'pulse-up' : 'pulse-down';
        scoreElement.classList.remove('pulse-up', 'pulse-down');
        void scoreElement.offsetWidth; // Trigger reflow to restart the animation
        scoreElement.classList.add(pulseClass);
        adjustCharacterPool(change);
    }
    score = newScore;
}