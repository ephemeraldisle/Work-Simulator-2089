import * as CONSTANTS from "./constants.js";
import { shuffleArray } from "./utils.js";
import * as UI from "./ui.js";
import * as Grid from "./grid.js";
import { initializeNavigation } from "./navigation.js";

class Game {
  constructor() {
    this.state = {
      characterPool: [],
      availableCharacters: [],
      score: 0,
      matchingPicks: 0,
      correctPicks: 0,
      incorrectPicks: 0,
      rows: CONSTANTS.GRID_DEFAULT_ROWS,
      cols: CONSTANTS.GRID_DEFAULT_COLS,
      roundDuration: CONSTANTS.INITIAL_ROUND_DURATION,
      roundInProgress: false,
      timescale: 1,
      gameRunning: false,
    };

    this.elements = null;
    this.totalValidCharacters = this.calculateTotalValidCharacters();
    this.roundTimer = null;
    this.swipeTimer = null;
    this.overlayTimer = null;
    this.handleTimescaleChange = this.handleTimescaleChange.bind(this);
    this.startGame = this.startGame.bind(this);
    this.handleGridClick = this.handleGridClick.bind(this);
  }

  initializeGame() {
    this.elements = UI.initializeUI();
    UI.setElements(this.elements);
    this.populateCharacterPool();
    Grid.createAllGridCells(
      this.elements.gameGrid,
      CONSTANTS.GRID_MAX_ROWS * CONSTANTS.GRID_MAX_COLS
    );
    UI.setupTimescaleControl(this.handleTimescaleChange);
    initializeNavigation(this.state, this.elements);

    UI.setCharacterDisplayFont("Noto Sans Linear A");

    this.elements.startGameButton.addEventListener("click", this.startGame);
    this.elements.gameGrid.addEventListener("click", this.handleGridClick);
    this.addGridKeyboardEvents();

    console.log("Game initialized with elements:", this.elements);
  }

  startGame() {
    UI.hideInstructions();
    UI.showGameElements();
    this.state.gameRunning = true;
    UI.fadeOutOverlay();
    this.populateCharacterPool();
    this.updateUnlockedPercentage();
    this.state.score = 0;
    this.updateScore(0);
    this.startRound();
  }

  startRound() {
    if (!this.state.gameRunning) return;
    console.log("Starting round");

    this.clearTimers();
    this.calculateBonusPoints();

    this.state.correctPicks = 0;
    this.state.incorrectPicks = 0;
    this.state.roundInProgress = true;

    const targetCharacters = this.prepareCharacterPool();
    this.setupRound(targetCharacters);

    UI.resetRoundElements().then(() => {
      this.setupTimerAndAnimations();
      console.log(
        "Round setup complete with target characters:",
        targetCharacters
      );
    });
  }

  calculateBonusPoints() {
    if (!this.state.firstRound) {
      if (
        this.state.incorrectPicks === 0 &&
        this.state.correctPicks === this.state.matchingPicks
      ) {
        this.updateScore(1);
      }
      if (this.state.matchingPicks > 0 && this.state.correctPicks === 0) {
        this.updateScore(-1);
      }
    }
    this.state.firstRound = false;
  }

  setupTimerAndAnimations() {
    const duration = this.calculateRoundDuration();
    this.state.roundDuration = duration;
    console.log("Setting up timer and animations with duration:", duration);

    UI.startTimerAnimation(duration);
    UI.setupSwiperTransition(duration);

    this.roundStartTime = Date.now();
    this.roundTimer = setTimeout(() => this.endRound(), duration * 1000);
  }

  endRound(isEarly = false) {
    this.clearTimers();
    this.state.roundInProgress = false;
    const roundPercentage =
      ((Date.now() - this.roundStartTime) / this.state.roundDuration) * 100;
    UI.completeRoundAnimations(isEarly, roundPercentage);
    if (isEarly) {
      setTimeout(() => {
        if (this.state.gameRunning) {
          this.startRound();
        }
      }, CONSTANTS.END_ROUND_DURATION_S * 1000);
    } else {
      if (this.state.gameRunning) {
        this.startRound();
      }
    }
  }

  clearTimers() {
    clearTimeout(this.roundTimer);
    clearTimeout(this.swipeTimer);
    clearTimeout(this.overlayTimer);
  }

  handleGridClick(event) {
    const target = event.target.closest(".grid-cell.in-use");
    if (target) {
      const index = Array.from(this.elements.gameGrid.children).indexOf(target);
      this.gridClick(index, event);
    }
  }

  gridClick(index, event) {
    if (!this.state.gameRunning || !this.state.roundInProgress) return;
    const cell = this.elements.gameGrid.children[index];
    if (
      cell.classList.contains("correct") ||
      cell.classList.contains("incorrect")
    )
      return;

    const isCorrect = cell.classList.contains("chosen");
    const rect = cell.getBoundingClientRect();
    const x =
      event instanceof MouseEvent ? event.clientX : rect.left + rect.width / 2;
    const y =
      event instanceof MouseEvent ? event.clientY : rect.top + rect.height / 2;

    if (isCorrect) {
      UI.markCellAsCorrect(cell);
      this.state.correctPicks++;
      this.updateHintText();
      this.updateScore(1);
    } else {
      UI.markCellAsIncorrect(cell);
      this.state.incorrectPicks++;
      this.updateScore(-1);
    }

    UI.createParticles(x, y, isCorrect);

    cell.classList.add("hide-focus-visuals");
  }

  updateHintText() {
    const shouldEndRoundEarly = UI.updateHintText(
      this.state.correctPicks,
      this.state.matchingPicks
    );
    if (shouldEndRoundEarly) {
      this.endRound(true);
    }
  }

  updateScore(change) {
    const newScore = Math.max(0, this.state.score + change);
    const pulseClass = change > 0 ? "pulse-up" : "pulse-down";
    UI.updateScore(newScore, pulseClass);

    if (newScore !== this.state.score) {
      this.adjustCharacterPool(change);
    }
    this.state.score = newScore;
  }

  adjustCharacterPool(change) {
    if (change > 0 && this.state.availableCharacters.length > 0) {
      const addCount = Math.min(change, this.state.availableCharacters.length);
      this.state.characterPool = this.state.characterPool.concat(
        this.state.availableCharacters.splice(0, addCount)
      );
    } else if (
      change < 0 &&
      this.state.characterPool.length > CONSTANTS.SPECIAL_CHARACTER_COUNT
    ) {
      const removeCount = Math.min(
        Math.abs(change),
        this.state.characterPool.length
      );
      const removedChars = this.state.characterPool.splice(0, removeCount);
      this.state.availableCharacters =
        this.state.availableCharacters.concat(removedChars);
    }
    this.updateUnlockedPercentage();
  }

  updateUnlockedPercentage() {
    const percentage =
      (this.state.characterPool.length / this.totalValidCharacters) * 100;
    UI.updateUnlockedPercentage(percentage);
    if (this.checkVictory()) {
      this.state.roundInProgress = false;
    }
  }

  checkVictory() {
    const percentage =
      (this.state.characterPool.length / this.totalValidCharacters) * 100;
    if (percentage >= 100) {
      UI.fadeInOverlay();
      this.state.gameRunning = false;
      UI.displayVictoryMessage();
      return true;
    }
    return false;
  }

  handleTimescaleChange(event) {
    const newTimescale = parseFloat(event.target.value);
    this.updateTimeScale(newTimescale);
  }

  updateTimeScale(newTimescale) {
    if (newTimescale != this.state.timescale) {
      this.state.timescale = newTimescale;
      UI.updateBackgroundGradient(newTimescale);
      if (this.state.roundInProgress) {
        this.endRound(true);
      }
    }
  }

  calculateTotalValidCharacters() {
    return CONSTANTS.VALID_RANGES.reduce(
      (total, range) => total + (range[1] - range[0] + 1),
      0
    );
  }

  populateCharacterPool() {
    this.state.availableCharacters = CONSTANTS.VALID_RANGES.flatMap((range) =>
      Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)
    );
    this.state.availableCharacters = shuffleArray(
      this.state.availableCharacters
    );
    const initialPoolSize = Math.ceil(
      this.state.availableCharacters.length *
        CONSTANTS.CHARACTER_START_UNLOCK_PERCENT
    );
    this.state.characterPool = this.state.availableCharacters.splice(
      0,
      initialPoolSize
    );
    this.updateUnlockedPercentage();
  }

  prepareCharacterPool() {
    return shuffleArray([...this.state.characterPool]).slice(
      0,
      CONSTANTS.SPECIAL_CHARACTER_COUNT
    );
  }

  setupRound(targetCharacters) {
    this.determineGridDimensions();
    UI.updateCharacterDisplay(targetCharacters);
    Grid.updateGridVisibility(
      this.state.rows,
      this.state.cols,
      this.elements.gameGrid
    );
    this.state.matchingPicks = Grid.populateGridCells(
      targetCharacters,
      this.state.characterPool,
      this.elements.gameGrid
    );
    UI.calculateFontColors(
      this.state.characterPool.length,
      this.totalValidCharacters
    );
    Grid.adjustGrid(this.state.rows, this.state.cols, this.elements.gameGrid);
    Grid.applyAnimationMultiplier(this.state.rows, this.state.cols);
    this.updateHintText();
  }

  calculateRoundDuration() {
    const unlockPercentage =
      this.state.characterPool.length / this.totalValidCharacters;
    const baseDuration =
      CONSTANTS.INITIAL_ROUND_DURATION -
      unlockPercentage *
        (CONSTANTS.INITIAL_ROUND_DURATION - CONSTANTS.MIN_ROUND_DURATION);
    return (
      Math.max(CONSTANTS.MIN_ROUND_DURATION, baseDuration) *
      this.state.timescale
    );
  }

  determineGridDimensions() {
    if (this.state.score < CONSTANTS.MAX_SCORE_FOR_SQUARE_GRID) {
      const gridSize = Math.ceil(Math.sqrt(this.state.score + 1));
      this.state.rows = this.state.cols = gridSize;
    } else {
      this.state.rows = CONSTANTS.GRID_MAX_ROWS;
      this.state.cols = Math.min(
        CONSTANTS.GRID_MAX_COLS,
        Math.floor(this.state.score / CONSTANTS.GRID_MAX_ROWS) + 1
      );
    }
  }

  addGridKeyboardEvents() {
    this.elements.gameGrid.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const focusedCell = document.activeElement;
        if (focusedCell && focusedCell.classList.contains("grid-cell")) {
          event.preventDefault();
          const rect = focusedCell.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          this.gridClick(
            Array.from(this.elements.gameGrid.children).indexOf(focusedCell),
            { clientX: x, clientY: y }
          );
        }
      }
    });
  }
}

export default Game;
