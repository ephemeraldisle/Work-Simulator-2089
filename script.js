const VALID_RANGES = [
    [67072, 67382], // U+10600 to U+106AE (Linear A)
    [67392, 67413], // U+106B0 to U+106CD (Linear A)
    [67424, 67431]  // U+106D8 to U+106DF (Linear A)
];
const SPECIAL_CHARACTER_COUNT = 4;
const CHARACTER_START_UNLOCK_PERCENT = 0.01;

const MIN_ROUND_DURATION = 2;
const INITIAL_ROUND_DURATION = 10;

const BASE_FONT_COLOR_START = "#eeeeeebb";
const BASE_FONT_COLOR_END = "#ddddddaa";
const CHOSEN_FONT_COLOR_START = "#f2f2f2dd";
const CHOSEN_FONT_COLOR_END = "#ffffffff";
const BASE_FONT_SIZE_DIVISOR = 10;

const SWIPER_INITIAL_POSITION = "-110%";
const SWIPER_TARGET_POSITION = "10%";
const TIMER_SWIPE_TRANSITION_DURATION_S = MIN_ROUND_DURATION;

const TIMER_INITIAL_WIDTH = "0%";
const TIMER_FULL_WIDTH = "100%";
const TIMER_RESET_DELAY_MS = 50;

const ROUND_ENDING_TIME = MIN_ROUND_DURATION;
const END_ROUND_DURATION_S = 1;

const GRID_DEFAULT_ROWS = 1;
const GRID_DEFAULT_COLS = 1;
const MAX_SCORE_FOR_SQUARE_GRID = 100;
const GRID_MAX_ROWS = 10;
const GRID_MAX_COLS = 20;

const SCORE_PULSE_UP_CLASS = 'pulse-up';
const SCORE_PULSE_DOWN_CLASS = 'pulse-down';

const FADE_IN_DURATION = 2000;
const FADE_OUT_DURATION = 1000;
const ROUND_END_EARLY_THRESHOLD = 2000;

const CHARACTER_ANIMATION_MIN_DURATION = 10;
const CHARACTER_ANIMATION_MAX_DURATION = 60;
const CHARACTER_ANIMATION_MIN_OFFSET = -3;
const START_ANIMATION_MULTIPLIER = 2.75;
const END_ANIMATION_MULTIPLIER = 1;

const DEBOUNCE_TIME = 150;

const Game = (() => {
    let characterPool = [];
    let availableCharacters = [];
    let score = 0;
    let matchingPicks = 0;
    let correctPicks = 0;
    let incorrectPicks = 0;
    let rows = GRID_DEFAULT_ROWS, cols = GRID_DEFAULT_COLS;
    let roundDuration = 10;
    let roundInProgress = false;
    let timerID;
    let swipeTimerID;
    let firstRound = true;
    let lastUnlockPercentage = 0;
    let lastRoundStartTime = 0;
    let timescale = 1;
    let gameRunning = false;

    const totalValidCharacters = calculateTotalValidCharacters();
    const timerBar = document.getElementById('timer');
    const swiper = document.getElementById('swiper');
    const characterDisplay = document.getElementById("characterDisplay");
    const gameGrid = document.getElementById('gameGrid');
    const hintText = document.getElementById("hintText");
    const scoreElement = document.getElementById("score");
    const unlockedPercentageElement = document.getElementById("unlockedPercentage");
    const overlay = document.getElementById('overlay');
    const timescaleSelect = document.getElementById('timescaleSelect');
    const startGameButton = document.getElementById("startGame");

    const defaultDurations = {
        MIN_ROUND_DURATION,
        INITIAL_ROUND_DURATION,
        TIMER_SWIPE_TRANSITION_DURATION_S,
        ROUND_ENDING_TIME,
        END_ROUND_DURATION_S,
        FADE_IN_DURATION,
        FADE_OUT_DURATION,
        ROUND_END_EARLY_THRESHOLD
    };

    document.addEventListener("DOMContentLoaded", () => {
        initializeGame();

        window.addEventListener('resize', debounce(adjustGrid, DEBOUNCE_TIME));


        timescaleSelect.addEventListener("change", (event) => {
            const newTimescale = parseFloat(event.target.value);
            updateTimeScale(newTimescale);
        });


        startGameButton.addEventListener("click", () => {
            document.getElementById("instructions").style.display = "none";
            document.getElementById("timescaleControl").classList.remove("temporaryOpacity");
            document.getElementById("hintHolder").classList.remove("temporaryOpacity");
            swiper.style.opacity = 1;

            restartGame();
            gameRunning = true;
            fadeOutOverlay();
            populateCharacterPool();
            updateUnlockedPercentage();
            score = 0;
            updateScore(0);
            startRound();

        });

    });


    function initializeGame() {
        populateCharacterPool();
        createAllGridCells();
        characterDisplay.style.fontFamily = "Noto Sans Linear A";

    }

    function startRound() {
        if (!gameRunning) return;
        const now = Date.now();
        if (now - lastRoundStartTime < timescaleAdjustedValues.END_ROUND_DURATION_S * 1000) {
            console.log("Had to prevent another round from starting too soon.");
            return;
        }
        lastRoundStartTime = now;

        if (!firstRound) {
            calculateBonusPoints();
        }

        correctPicks = 0;
        incorrectPicks = 0;

        const targetCharacters = prepareCharacterPool();

        setupRound(targetCharacters);

        firstRound = false;
        clearTimers();
        roundInProgress = true;
        startTimer(roundDuration);
    }

    function prepareCharacterPool() {
        const tempCharacterPool = shuffleArray([...characterPool]);
        return tempCharacterPool.slice(0, SPECIAL_CHARACTER_COUNT);
    }

    function setupRound(targetCharacters) {
        characterDisplay.innerHTML = targetCharacters.map(codePoint => String.fromCodePoint(codePoint)).join("&nbsp;");
        matchingPicks = 0;
        roundDuration = calculateRoundDuration();
        adjustAnimationDuration(roundDuration);
        calculateFontColors();
        determineGridDimensions(score);
        createGrid(rows, cols);
        populateGridCells(targetCharacters);
        updateHintText(correctPicks, matchingPicks);
    }

    function clearTimers() {
        clearTimeout(timerID);
        clearTimeout(swipeTimerID);
    }

    async function startTimer(duration) {
        await resetRoundElements();
        return new Promise(resolve => {
            setTimeout(() => {
                setupTransitions(duration);
                setTimerWidths(duration, resolve);
                setupSwiperTransition(duration);
                setupTimerEndHandler(duration);
            }, 0);
        });
    }

    function setupTransitions(duration) {
        timerBar.style.transition = `width ${duration}s linear`;
        swiper.style.transition = `left ${timescaleAdjustedValues.TIMER_SWIPE_TRANSITION_DURATION_S}s linear`;
    }

    function setTimerWidths(duration, resolve) {
        setTimeout(() => {
            timerBar.style.width = TIMER_FULL_WIDTH;
            resolve();
        }, TIMER_RESET_DELAY_MS);
    }

    function setupSwiperTransition(duration) {
        clearTimeout(swipeTimerID);
        swipeTimerID = setTimeout(() => {
            swiper.style.left = SWIPER_TARGET_POSITION;
        }, Math.max(duration - timescaleAdjustedValues.TIMER_SWIPE_TRANSITION_DURATION_S, 0) * 1000);
    }

    function setupTimerEndHandler(duration) {
        clearTimeout(timerID);
        timerID = setTimeout(() => {
            if (!roundInProgress) return;
            fadeInOverlay();
            setTimeout(() => {
                roundInProgress = false;
                handleTimeout();
                fadeOutOverlay();
            }, timescaleAdjustedValues.FADE_IN_DURATION);
        }, (duration - timescaleAdjustedValues.MIN_ROUND_DURATION) * 1000);
    }

    async function endRoundEarly() {
        if (!roundInProgress) return;
        const now = Date.now();
        const elapsedTime = now - lastRoundStartTime;
        const remainingTime = roundDuration * 1000 - elapsedTime;

        if (remainingTime < timescaleAdjustedValues.ROUND_END_EARLY_THRESHOLD) {
            return;
        }

        roundInProgress = false;
        fadeInOverlay();
        await resetAndTransitionElements();
        fadeOutOverlay();
        startRound();
    }

    async function resetAndTransitionElements() {
        return new Promise(resolve => {
            clearTimeout(timerID);
            clearTimeout(swipeTimerID);
            adjustAnimationDuration(timescaleAdjustedValues.END_ROUND_DURATION_S);

            setTimeout(() => {
                timerBar.style.transition = `width ${timescaleAdjustedValues.END_ROUND_DURATION_S}s linear`;
                swiper.style.transition = `left ${timescaleAdjustedValues.END_ROUND_DURATION_S}s linear`;
                timerBar.style.width = TIMER_FULL_WIDTH;
                swiper.style.left = SWIPER_TARGET_POSITION;
                setTimeout(() => {
                    resolve();
                }, timescaleAdjustedValues.FADE_OUT_DURATION);
            }, TIMER_RESET_DELAY_MS);
        });
    }

    function handleTimeout() {
        if (roundInProgress) return;
        startRound();
    }

    async function resetRoundElements() {
        swiper.style.transition = 'none';
        swiper.style.left = SWIPER_INITIAL_POSITION;

        timerBar.style.transition = 'none';
        timerBar.style.width = TIMER_INITIAL_WIDTH;
        return new Promise(resolve => setTimeout(resolve, TIMER_RESET_DELAY_MS));
    }

    function checkVictory() {
        const percentage = (characterPool.length / totalValidCharacters) * 100;
        if (percentage >= 100) {

            fadeInOverlay();
            gameRunning = false;
            displayVictoryMessage();
            return true;
        }
        return false;
    }

    function displayVictoryMessage() {
        swiper.style.opacity = 0;
        document.getElementById('instructionsText').innerHTML = `
            <h1>Congratulations!</h1>
            <p>You've sorted all the data, made our company 43,000 credits, and earned yourself a fat paycheck of 100 credits!</p>
        `;

        document.querySelector('.instructions').style.display = "flex";
        document.getElementById('startButtonText').textContent = "Work another shift?"
    }

    function restartGame() {
        firstRound = true;
        characterPool = [];
        availableCharacters = [];
    }
    // Utility Functions
    function calculateTotalValidCharacters() {
        return VALID_RANGES.reduce((total, range) => total + (range[1] - range[0] + 1), 0);
    }

    function calculateRoundDuration() {
        const unlockPercentage = characterPool.length / totalValidCharacters;
        return timescaleAdjustedValues.INITIAL_ROUND_DURATION - (unlockPercentage * (timescaleAdjustedValues.INITIAL_ROUND_DURATION - timescaleAdjustedValues.MIN_ROUND_DURATION));
    }

    function calculateBonusPoints() {
        if (incorrectPicks === 0 && correctPicks === matchingPicks) {
            updateScore(1);
        }
        if (matchingPicks > 0 && correctPicks === 0) {
            updateScore(-1);
        }
    }

    function adjustAnimationDuration(duration) {
        document.documentElement.style.setProperty('--round-duration', `${duration}s`);
    }

    function calculateAnimationMultiplier() {
        const maxGridSize = GRID_MAX_ROWS * GRID_MAX_COLS;
        const currentGridSize = rows * cols;
        return START_ANIMATION_MULTIPLIER - ((START_ANIMATION_MULTIPLIER - END_ANIMATION_MULTIPLIER) * (currentGridSize / maxGridSize));
    }

    function applyAnimationMultiplier() {
        const multiplier = calculateAnimationMultiplier();
        document.documentElement.style.setProperty('--animation-multiplier', multiplier);
    }

    function calculateFontColors() {
        const unlockCount = characterPool.length;
        const { baseFontColor, chosenFontColor } = getPrecomputedColors(unlockCount);

        document.documentElement.style.setProperty('--base-font-color', baseFontColor);
        document.documentElement.style.setProperty('--chosen-font-color', chosenFontColor);
    }

    function fadeInOverlay() {
        if (!gameRunning) return;
        overlay.classList.add('fade-in');
        overlay.classList.remove('fade-out');
    }

    function fadeOutOverlay() {

        if (!gameRunning) return;
        overlay.classList.add('fade-out');
        overlay.classList.remove('fade-in');
    }

    function createAllGridCells() {
        const maxCells = GRID_MAX_ROWS * GRID_MAX_COLS;
        const fragment = document.createDocumentFragment();
        for (let cellIndex = 0; cellIndex < maxCells; cellIndex++) {
            const cell = document.createElement('div');
            cell.classList.add('gridCell', 'not-in-use');
            generateRandomBorders(cell);
            const charElement = document.createElement('div');
            charElement.classList.add('gridChar');
            cell.appendChild(charElement);
            fragment.appendChild(cell);
        }
        gameGrid.appendChild(fragment);
        addGridEventListeners();
    }



    function updateGridVisibility(rows, cols) {
        const totalCells = rows * cols;
        const cells = document.querySelectorAll(".gridCell");
        cells.forEach((cell, index) => {
            if (index < totalCells) {
                cell.classList.add('in-use');
                cell.classList.remove('not-in-use');
            } else {
                cell.classList.remove('in-use');
                cell.classList.add('not-in-use');
            }
        });
    }

    function createGrid(rows, cols) {
        updateGridVisibility(rows, cols);
        adjustGrid();
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
        updateUnlockedPercentage();
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
        const cells = document.querySelectorAll(".gridCell.in-use");
        cells.forEach(cell => {
            cell.classList.remove("chosen", "correct", "incorrect");
            const unicodeChar = getLinearChar();
            const charElement = cell.querySelector(".gridChar");
            charElement.textContent = String.fromCodePoint(unicodeChar);
            cell.style.fontSize = getRandomFontSize();
            charElement.style.animation = generateRandomAnimations();

            if (targetCharacters.includes(unicodeChar)) {
                cell.classList.add("chosen");
                matchingPicks += 1;
            }
        });
    }


    function adjustCharacterPool(change) {
        if (change > 0 && availableCharacters.length > 0) {
            const addCount = Math.min(change, availableCharacters.length);
            characterPool = characterPool.concat(availableCharacters.splice(0, addCount));
        } else if (change < 0 && characterPool.length > SPECIAL_CHARACTER_COUNT) {
            const removeCount = Math.min(Math.abs(change), characterPool.length);
            const removedChars = characterPool.splice(0, removeCount);
            availableCharacters = availableCharacters.concat(removedChars);
        }
        updateUnlockedPercentage();
    }


    function addGridEventListeners() {
        gameGrid.addEventListener('click', (event) => {
            const target = event.target.closest('.gridCell.in-use');
            if (target) {
                const index = Array.from(gameGrid.children).indexOf(target);
                gridClick(index, event);
            }
        });
    }
    const gridClick = (i, event) => {
        if (!gameRunning) return;
        const cells = document.querySelectorAll(".gridCell");
        if (cells[i].classList.contains("correct") || cells[i].classList.contains("incorrect")) {
            return;
        }
    
        const isCorrect = cells[i].classList.contains("chosen");
        const x = event.clientX;
        const y = event.clientY;
    
        if (isCorrect) {
            cells[i].classList.add("correct");
            correctPicks += 1;
            updateHintText(correctPicks, matchingPicks);
            updateScore(1);
        } else {
            cells[i].classList.add("incorrect");
            incorrectPicks += 1;
            updateScore(-1);
        }
    
        createParticles(x, y, isCorrect);

    }

    function createParticles(x, y, isCorrect) {
        const particleCount = randomIntFromInterval(12, 18);
        const container = document.body;
        const baseColor = isCorrect ? getComputedStyle(document.documentElement).getPropertyValue('--correct-color') : getComputedStyle(document.documentElement).getPropertyValue('--incorrect-color');
        const fragment = document.createDocumentFragment();
    
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle-line');
            
            const angle = Math.random() * 2 * Math.PI;
            const speed = (Math.random() - 0.5) * 6;
            const size = 20 + Math.random() * 3;
            const duration = 0.5 + Math.random() * 0.5;
    
            particle.style.width = `${size}px`;
            particle.style.height = `${5 + Math.random() * 2}px`;
            particle.style.backgroundColor = baseColor;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--angle', `${angle}rad`);
            particle.style.filter = `hue-rotate(${randomIntFromInterval(0, 45)}deg)`;
            fragment.appendChild(particle);
    
            requestAnimationFrame(() => {
                particle.style.transform = `
                    translate(${Math.cos(angle) * speed * 75}px, ${Math.sin(angle) * speed * 75}px)
                    rotate(${angle}rad)
                `;
                particle.style.transition = `transform ${duration}s ease-out`;
            });
    
            particle.addEventListener('transitionend', () => {
                particle.remove();
            });
        }
        container.appendChild(fragment);
    }
    

    function updateHintText(count, total) {
        const remainingMatches = total - count;
        if (remainingMatches === 0 && total > 0) {
            hintText.textContent = "All matches found!";
            endRoundEarly();
        } else if (remainingMatches === 1) {
            hintText.textContent = "1 match remaining.";
        } else if (remainingMatches > 1) {
            hintText.textContent = `${remainingMatches} matches remaining.`;
        } else {
            hintText.textContent = "No matches this round.";
        }
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

    function updateUnlockedPercentage() {
        const percentage = (characterPool.length / totalValidCharacters) * 100;
        unlockedPercentageElement.textContent = `(${percentage.toFixed(2)}%)`;
        if (checkVictory()) {
            roundInProgress = false;
        }
    }


    function getRandomFontSize() {
        const baseFontSize = BASE_FONT_SIZE_DIVISOR / Math.min(rows, cols);
        const randomFontSizeVh = baseFontSize + Math.random() * baseFontSize;
        const randomFontSizeVw = baseFontSize + Math.random() * baseFontSize;
        return `calc(${randomFontSizeVh}vh + ${randomFontSizeVw}vw)`;
    }

    function getLinearChar() {
        return characterPool[Math.floor(Math.random() * characterPool.length)];
    }

    function generateRandomAnimations() {
        applyAnimationMultiplier();

        const randomDuration = () => `${CHARACTER_ANIMATION_MIN_DURATION * Math.random() + randomIntFromInterval(CHARACTER_ANIMATION_MIN_DURATION, CHARACTER_ANIMATION_MAX_DURATION)}s`;
        const randomDelay = () => `${Math.random() * CHARACTER_ANIMATION_MIN_OFFSET}s`;

        return `${randomDuration()} rotateCharacter ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} horizontalCharacterMovement ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} verticalCharacterMovement ease-in-out infinite alternate ${randomDelay()}, 
                ${randomDuration()} pulseCharacter ease-in-out infinite alternate ${randomDelay()}`;
    }

    function getCharacterPool() {
        return characterPool;
    }

    const timescaleAdjustedValues = {
        MIN_ROUND_DURATION: MIN_ROUND_DURATION * timescale,
        INITIAL_ROUND_DURATION: INITIAL_ROUND_DURATION * timescale,
        TIMER_SWIPE_TRANSITION_DURATION_S: TIMER_SWIPE_TRANSITION_DURATION_S * timescale,
        ROUND_ENDING_TIME: ROUND_ENDING_TIME * timescale,
        END_ROUND_DURATION_S: END_ROUND_DURATION_S * timescale,
        FADE_IN_DURATION: FADE_IN_DURATION * timescale,
        FADE_OUT_DURATION: FADE_OUT_DURATION * timescale,
        ROUND_END_EARLY_THRESHOLD: ROUND_END_EARLY_THRESHOLD * timescale
    };

    function updateTimeScale(newTimescale) {
        timescale = newTimescale;
        Object.keys(defaultDurations).forEach(key => {
            timescaleAdjustedValues[key] = defaultDurations[key] * timescale;
        });
        updateCSSVariables();
    }

    function updateCSSVariables() {
        document.documentElement.style.setProperty('--timescale', timescale);
    }


    return {
        startRound,
        endRoundEarly,
        startTimer,
        calculateTotalValidCharacters,
        populateCharacterPool,
        resetRoundElements,
        getCharacterPool,
        initializeGame,
        updateTimeScale
    };
})();

window.Game = Game;
