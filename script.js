const VALID_RANGES = [
    [67072, 67382], // U+10600 to U+106AE (Linear A)
    [67392, 67413], // U+106B0 to U+106CD (Linear A)
    [67424, 67431]  // U+106D8 to U+106DF (Linear A)
];
const SPECIAL_CHARACTER_COUNT = 4;
const CHARACTER_START_UNLOCK_PERCENT = 0.01;

const INITIAL_FONT_COLOR = "#eeeeeebb";
const CHOSEN_FONT_COLOR = "#f2f2f2dd";
const BASE_FONT_SIZE_DIVISOR = 10;

const SWIPER_INITIAL_POSITION = "-300%";
const SWIPER_TARGET_POSITION = "10%";
const TIMER_SWIPE_TRANSITION_DURATION_S = 3;

const TIMER_INITIAL_WIDTH = "0%";
const TIMER_FULL_WIDTH = "100%";
const TIMER_RESET_DELAY_MS = 50;

const END_ROUND_DURATION_S = 1;

const GRID_DEFAULT_ROWS = 1;
const GRID_DEFAULT_COLS = 1;
const MAX_SCORE_FOR_SQUARE_GRID = 64;
const GRID_MAX_ROWS = 8;
const GRID_MAX_COLS = 15;

const SCORE_PULSE_UP_CLASS = 'pulse-up';
const SCORE_PULSE_DOWN_CLASS = 'pulse-down';

const CHARACTER_ANIMATION_MIN_DURATION = 10;
const CHARACTER_ANIMATION_MAX_DURATION = 60;
const CHARACTER_ANIMATION_MIN_OFFSET = -3;

const Game = (() => {
    let characterPool = [];
    let availableCharacters = [];
    let score = 0;
    let matchingPicks = 0;
    let correctPicks = 0;
    let rows = GRID_DEFAULT_ROWS, cols = GRID_DEFAULT_COLS;
    let roundDuration = 10;
    let roundInProgress = false;
    let timerID;
    let swipeTimerID;

    const totalValidCharacters = calculateTotalValidCharacters();
    const timerBar = document.getElementById('timer');
    const swiper = document.getElementById('swiper');
    const startButton = document.getElementById("start");
    const gameGrid = document.getElementById('gameGrid');
    const answerNumber = document.getElementById("answerNumber");
    const scoreElement = document.getElementById("score");
    const unlockedPercentageElement = document.getElementById("unlockedPercentage");

    document.addEventListener("DOMContentLoaded", () => {
        initializeGame();
    });

    function initializeGame() {
        populateCharacterPool();
        createGrid(GRID_DEFAULT_ROWS, GRID_DEFAULT_COLS);
        startRound();
        window.addEventListener('resize', adjustGrid);
        adjustGrid();
        updateScore(0);
    }

    function calculateTotalValidCharacters() {
        return VALID_RANGES.reduce((total, range) => total + (range[1] - range[0] + 1), 0);
    }

    function populateCharacterPool() {
        VALID_RANGES.forEach(range => {
            for (let i = range[0]; i <= range[1]; i++) {
                availableCharacters.push(i);
            }
        });
        availableCharacters = shuffleArray(availableCharacters);
        const initialPoolSize = Math.ceil(availableCharacters.length * CHARACTER_START_UNLOCK_PERCENT);
        characterPool = availableCharacters.splice(0, initialPoolSize);
        if (characterPool.length === 0) {
            throw new Error(`Character pool is empty after initialization. Expected at least ${initialPoolSize} characters.`);
        }
        console.log(('characterPool is now this size: ', characterPool.length))
        updateUnlockedPercentage();
    }



    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function startRound() {
        if (matchingPicks > 0) {
            updateScore(correctPicks === matchingPicks ? 1 : -1);
        }

        const tempCharacterPool = shuffleArray([...characterPool]);
        const targetCharacters = tempCharacterPool.slice(0, SPECIAL_CHARACTER_COUNT);

        startButton.innerHTML = targetCharacters.map(codePoint => String.fromCodePoint(codePoint)).join("&nbsp;");
        startButton.style.fontFamily = "Noto Sans Linear A";

        matchingPicks = 0;
        correctPicks = 0;

        determineGridDimensions(score);
        createGrid(rows, cols);
        startTimer(roundDuration);
        adjustGrid();
        populateGridCells(targetCharacters);
        updateAnswerNumber(correctPicks, matchingPicks);
    }

    function createGrid(rows, cols) {
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

    function determineGridDimensions(score) {
        if (score < MAX_SCORE_FOR_SQUARE_GRID) {
            const gridSize = Math.ceil(Math.sqrt(score + 1));
            rows = gridSize;
            cols = gridSize;
        } else {
            rows = GRID_MAX_ROWS;
            cols = Math.min(GRID_MAX_COLS, Math.floor(score / GRID_MAX_ROWS) + 1);
        }
    }

    function populateGridCells(targetCharacters) {
        const cells = document.querySelectorAll(".gridCell");
        cells.forEach(cell => {
            cell.classList.remove("chosen", "correct", "incorrect");
            const char = getLinearChar();
            cell.querySelector(".gridChar").textContent = String.fromCodePoint(char);
            cell.style.fontSize = getRandomFontSize();
            cell.style.color = INITIAL_FONT_COLOR;
            cell.querySelector(".gridChar").style.animation = generateRandomAnimations();

            if (targetCharacters.includes(char)) {
                cell.style.color = CHOSEN_FONT_COLOR;
                cell.classList.add("chosen");
                matchingPicks += 1;
            }
        });
    }

    function updateAnswerNumber(count, total) {
        const remainingMatches = total - count;
        if (remainingMatches === 0) {
            answerNumber.textContent = "All matches found!";
            endRoundEarly();
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
        const randomDuration = () => `${CHARACTER_ANIMATION_MIN_DURATION * Math.random() + randomIntFromInterval(CHARACTER_ANIMATION_MIN_DURATION, CHARACTER_ANIMATION_MAX_DURATION)}s`;
        const randomDelay = () => `${Math.random() * CHARACTER_ANIMATION_MIN_OFFSET}s`;

        return `${randomDuration()} wiggle ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} hori ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} vert ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} pulse ease-in-out infinite alternate ${randomDelay()}`;
    }

    function getRandomFontSize() {
        const baseFontSize = BASE_FONT_SIZE_DIVISOR / Math.max(rows, cols);
        const randomFontSizeVh = baseFontSize + Math.random() * baseFontSize;
        const randomFontSizeVw = baseFontSize + Math.random() * baseFontSize;
        return `calc(${randomFontSizeVh}vh + ${randomFontSizeVw}vw)`;
    }

    function adjustGrid() {
        determineGridDimensions(score);
        gameGrid.style.setProperty('--grid-rows', rows);
        gameGrid.style.setProperty('--grid-cols', cols);

        const cells = document.querySelectorAll(".gridCell");
        cells.forEach(cell => {
            cell.style.fontSize = getRandomFontSize();
        });
    }

    function updateScore(change) {
        const newScore = Math.max(0, score + change);
        scoreElement.textContent = newScore;

        if (newScore !== score) {
            const pulseClass = change > 0 ? SCORE_PULSE_UP_CLASS : SCORE_PULSE_DOWN_CLASS;
            scoreElement.classList.remove(SCORE_PULSE_UP_CLASS, SCORE_PULSE_DOWN_CLASS);
            void scoreElement.offsetWidth;
            scoreElement.classList.add(pulseClass);
            adjustCharacterPool(change);
        }
        score = newScore;
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
        unlockedPercentageElement.textContent = `(${percentage.toFixed(2)}%)`;
    }

    function getLinearChar() {
        return characterPool[Math.floor(Math.random() * characterPool.length)];
    }

    async function startTimer(duration) {
        roundInProgress = true;
        await resetRoundElements();
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('startTimer - before setting transition:', timerBar.style.transition);
                timerBar.style.transition = `width ${duration}s linear`;
                swiper.style.transition = `left ${TIMER_SWIPE_TRANSITION_DURATION_S}s linear`;
                console.log('startTimer - after setting transition:', timerBar.style.transition);
                adjustAnimationDuration(duration);

                setTimeout(() => {
                    timerBar.style.width = TIMER_FULL_WIDTH;
                    resolve();
                }, TIMER_RESET_DELAY_MS);

                clearTimeout(swipeTimerID);
                swipeTimerID = setTimeout(() => {
                    swiper.style.left = SWIPER_TARGET_POSITION;
                }, Math.max(duration - TIMER_SWIPE_TRANSITION_DURATION_S, 0) * 1000);

                clearTimeout(timerID);
                timerID = setTimeout(() => {
                    handleTimeout();
                }, duration * 1000);
            }, 0);
        });
    }





    function handleTimeout() {
        if (!roundInProgress) return;
        roundInProgress = false;
        startRound();
    }



    async function resetRoundElements() {
        swiper.style.transition = 'none';
        swiper.style.left = SWIPER_INITIAL_POSITION;

        timerBar.style.transition = 'none';
        timerBar.style.width = TIMER_INITIAL_WIDTH;
        return new Promise(resolve => setTimeout(resolve, TIMER_RESET_DELAY_MS)); // Ensure a short delay before resolving
    }

    function adjustAnimationDuration(duration) {
        document.documentElement.style.setProperty('--round-duration', `${duration}s`);
    }


    async function endRoundEarly() {
        return new Promise(resolve => {
            setTimeout(() => {
                clearTimeout(timerID);
                clearTimeout(swipeTimerID);
                adjustAnimationDuration(END_ROUND_DURATION_S); // Adjust to complete in 1 second

                setTimeout(() => {
                    console.log('endRoundEarly - before setting transition:', timerBar.style.transition);
                    timerBar.style.transition = `width ${END_ROUND_DURATION_S}s linear`;
                    swiper.style.transition = `left ${END_ROUND_DURATION_S}s linear`;
                    console.log('endRoundEarly - after setting transition:', timerBar.style.transition);
                    timerBar.style.width = TIMER_FULL_WIDTH;
                    swiper.style.left = SWIPER_TARGET_POSITION;
                    resolve();
                }, TIMER_RESET_DELAY_MS);

                timerID = setTimeout(() => {
                    handleTimeout(); // Call the timeout handler after the short duration
                }, END_ROUND_DURATION_S * 1000);
            }, 0);
        });
    }

function getCharacterPool(){
    return characterPool
}

    return {
        startRound,
        endRoundEarly,
        startTimer,
        calculateTotalValidCharacters,
        populateCharacterPool,
        resetRoundElements,
        getCharacterPool,
        initializeGame
    };
})();

window.Game = Game;
