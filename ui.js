import { getPrecomputedColors, randomIntFromInterval } from "./utils.js";
import * as CONSTANTS from "./constants.js";

let elements = null;
let swipeTimer = null;

export function initializeUI() {
  const elements = {
    timerBar: document.getElementById("timer"),
    swiper: document.getElementById("swiper"),
    characterDisplay: document.getElementById("character-display"),
    characterDisplayText: document.getElementById("character-display-text"),
    gameGrid: document.getElementById("game-grid"),
    hintText: document.getElementById("hint-text"),
    scoreElement: document.getElementById("score"),
    scoreHolder: document.getElementById("score-holder"),
    unlockedPercentageElement: document.getElementById("unlocked-percentage"),
    overlay: document.getElementById("overlay"),
    instructions: document.getElementById("instructions"),
    timescaleControl: document.getElementById("timescale-control"),
    timescaleSelect: document.getElementById("timescale-select"),
    hintHolder: document.getElementById("hint-holder"),
    startGameButton: document.getElementById("start-game"),
    startButtonText: document.getElementById("start-button-text"),
    gameContainer: document.querySelector(".game-container"),
    fullscreenButton: document.getElementById("fullscreen-button"),
    fullscreenIcon: document.querySelector(".fullscreen-icon"),
    exitFullscreenIcon: document.querySelector(".exit-fullscreen-icon"),
    accessibilityAnnouncer: document.getElementById("accessibility-announcer"),
  };

  // Validate that all elements were found
  for (const [key, value] of Object.entries(elements)) {
    if (!value) {
      console.warn(`Failed to find element: ${key}`);
      elements[key] = document.createElement("div");
    }
  }
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = !!document.fullscreenElement;
    updateFullscreenIcons(isFullscreen);
  });
  return elements;
}
export function setElements(newElements) {
  elements = newElements;
}

export function hideInstructions() {
  elements.instructions.style.display = "none";
}

export function showGameElements() {
  elements.timescaleControl.classList.remove("temporaryOpacity");
  elements.hintHolder.classList.remove("temporaryOpacity");
  elements.swiper.style.opacity = 1;
}

export function fadeInOverlay() {
  elements.overlay.classList.add("fade-in");
  elements.overlay.classList.remove("fade-out");
  console.log("Overlay fade-in triggered");
}

export function fadeOutOverlay() {
  elements.overlay.classList.add("fade-out");
  elements.overlay.classList.remove("fade-in");
  console.log("Overlay fade-out triggered");
}

export async function resetRoundElements() {
  elements.swiper.style.transition = "none";
  elements.swiper.style.left = "-110%";

  elements.timerBar.style.transition = "none";
  elements.timerBar.style.width = "0%";
  fadeOutOverlay();
  // Force a reflow
  void elements.timerBar.offsetWidth;
  void elements.swiper.offsetWidth;

  return new Promise((resolve) => setTimeout(resolve, 50));
}

export function startTimerAnimation(duration) {
  elements.timerBar.style.transition = `width ${duration}s linear`;
  elements.timerBar.style.width = "100%";

  console.log(`Timer animation started with duration: ${duration}`);
}

export function setupSwiperTransition(duration) {
  const swipeDelay = Math.max(0, duration - CONSTANTS.MIN_ROUND_DURATION);

  if (swipeTimer) {
    clearTimeout(swipeTimer);
  }

  elements.swiper.style.transition = "none";
  elements.swiper.style.left = "-110%";

  // Force a reflow
  void elements.swiper.offsetWidth;

  swipeTimer = setTimeout(() => {
    elements.swiper.style.transition = `left ${CONSTANTS.MIN_ROUND_DURATION}s linear`;
    elements.swiper.style.left = "10%";
    console.log("Swiper transition applied");
  }, swipeDelay * 1000);

  console.log(
    `Swiper transition setup with duration: ${duration}, swipeDelay: ${swipeDelay}`
  );
}

export function completeTimerAnimation(duration) {
  elements.timerBar.style.transition = `width ${duration}s linear`;
  elements.timerBar.style.width = "100%";
}

export function completeRoundAnimations(isEarly, percentage) {
  if (isEarly) {
    const duration = CONSTANTS.END_ROUND_DURATION_S;
    elements.timerBar.style.transition = `width ${duration}s linear`;
    elements.timerBar.style.width = `${percentage}%`;

    void elements.timerBar.offsetWidth;
    elements.timerBar.style.width = "100%";

    clearTimeout(swipeTimer);
    elements.swiper.style.transition = `left ${duration}s linear`;
    elements.swiper.style.left = "10%";

    void elements.swiper.offsetWidth;
  }
  fadeInOverlay();
}

export function updateHintText(correctPicks, matchingPicks) {
  const remainingMatches = matchingPicks - correctPicks;
  if (remainingMatches === 0 && matchingPicks > 0) {
    elements.hintText.textContent = "All matches found!";
    elements.accessibilityAnnouncer.textContent = "All matches found!"; // Announce via screen reader
    return true; // Signal to end round early
  } else if (remainingMatches === 1) {
    elements.hintText.textContent = "1 match remaining.";
    elements.accessibilityAnnouncer.textContent = "1 match remaining."; // Announce via screen reader
  } else if (remainingMatches > 1) {
    elements.hintText.textContent = `${remainingMatches} matches remaining.`;
    elements.accessibilityAnnouncer.textContent = `${remainingMatches} matches remaining.`; // Announce via screen reader
  } else {
    elements.hintText.textContent = "No matches this round.";
    elements.accessibilityAnnouncer.textContent = "No matches this round."; // Announce via screen reader
  }
  return false;
}

export function updateScore(newScore, pulseClass) {
  elements.scoreElement.textContent = newScore;
  elements.scoreElement.classList.remove("pulse-up", "pulse-down");
  void elements.scoreElement.offsetWidth; // Trigger reflow
  if (pulseClass) {
    elements.scoreElement.classList.add(pulseClass);
  }
}

export function updateUnlockedPercentage(percentage) {
  if (elements && elements.unlockedPercentageElement) {
    elements.unlockedPercentageElement.textContent = `(${percentage.toFixed(
      2
    )}%)`;
  } else {
    console.warn("Unlocked percentage element not found. Unable to update.");
  }
}

export function displayVictoryMessage() {
  elements.swiper.style.opacity = 0;
  elements.instructions.innerHTML = `
        <h1>Congratulations!</h1>
        <p>You've sorted all the data, made our company 43,000 credits, and earned yourself a fat paycheck of 100 credits!</p>
    `;
  elements.instructions.style.display = "flex";
  elements.startButtonText.textContent = "Work another shift?";
}

export function calculateFontColors(unlockCount, totalValidCharacters) {
  const { baseFontColor, chosenFontColor } = getPrecomputedColors(unlockCount);
  document.documentElement.style.setProperty(
    "--base-font-color",
    baseFontColor
  );
  document.documentElement.style.setProperty(
    "--chosen-font-color",
    chosenFontColor
  );
}

export function updateCSSVariables(timescale) {
  document.documentElement.style.setProperty("--timescale", timescale);
}

export function setCharacterDisplayFont(fontFamily) {
  elements.characterDisplay.style.fontFamily = fontFamily;
}

export function markCellAsCorrect(cell) {
  cell.classList.add("correct");
}

export function markCellAsIncorrect(cell) {
  cell.classList.add("incorrect");
}

export function updateCharacterDisplay(targetCharacters) {
  elements.characterDisplayText.innerHTML = targetCharacters
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join("&nbsp;");
}

export function createParticles(x, y, isCorrect) {
  const particleCount = randomIntFromInterval(12, 18);
  const container = document.body;
  const baseColor = isCorrect
    ? getComputedStyle(document.documentElement).getPropertyValue(
        "--color-correct"
      )
    : getComputedStyle(document.documentElement).getPropertyValue(
        "--color-incorrect"
      );
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle-line");

    const angle = Math.random() * 2 * Math.PI;
    const speed = (Math.random() - 0.5) * 6;
    const size = 2 + Math.random() * 0.3;
    const duration = 0.5 + Math.random() * 0.5;

    particle.style.width = `${size}vw`;
    particle.style.height = `${0.5 + Math.random() * 0.2}vw`;
    particle.style.backgroundColor = baseColor;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--angle", `${angle}rad`);
    particle.style.filter = `hue-rotate(${randomIntFromInterval(0, 45)}deg)`;
    fragment.appendChild(particle);

    requestAnimationFrame(() => {
      particle.style.transform = `
                translate(${Math.cos(angle) * speed * 75}px, ${
        Math.sin(angle) * speed * 75
      }px)
                rotate(${angle}rad)
            `;
      particle.style.transition = `transform ${duration}s ease-out`;
    });

    particle.addEventListener("transitionend", () => {
      particle.remove();
    });
  }
  container.appendChild(fragment);
}

export function updateBackgroundGradient(timescale) {
  const gradients = {
    0.25: ["#FF5733", "#FF7957"],
    0.5: ["#33FF57", "#57FF7B"],
    1: ["#00dbb3", "#33fdd6"],
    2: ["#5733FF", "#7B57FF"],
    4: ["#FF3357", "#FF577B"],
    8: ["#3357FF", "#577BFF"],
  };

  const [primaryColor, secondaryColor] = gradients[timescale] || gradients[1];
  elements.gameContainer.style.background = `radial-gradient(${primaryColor} 95%, ${secondaryColor} 97%)`;
  document.documentElement.style.setProperty(
    "--color-border-primary",
    primaryColor
  );
  document.documentElement.style.setProperty(
    "--color-border-secondary",
    secondaryColor
  );
}

export function setupTimescaleControl(handleTimescaleChange) {
  const timescaleControl = elements.timescaleControl;
  const timescaleSelect = elements.timescaleSelect;

  if (!timescaleControl || !timescaleSelect) {
    console.error("Timescale control elements not found");
    return;
  }

  const selectedDiv = document.createElement("div");
  selectedDiv.setAttribute("class", "select-selected");
  selectedDiv.textContent =
    timescaleSelect.options[timescaleSelect.selectedIndex].text;
  selectedDiv.tabIndex = 0;
  timescaleControl.appendChild(selectedDiv);

  const itemsDiv = document.createElement("div");
  itemsDiv.setAttribute("class", "select-items select-hide");

  Array.from(timescaleSelect.options).forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.textContent = option.text;
    optionDiv.tabIndex = -1; // Make options not focusable by default
    optionDiv.addEventListener("click", function (e) {
      updateSelectedOption(
        this,
        timescaleSelect,
        selectedDiv,
        itemsDiv,
        handleTimescaleChange
      );
    });
    itemsDiv.appendChild(optionDiv);
  });

  timescaleControl.appendChild(itemsDiv);

  selectedDiv.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleDropdown(this, itemsDiv);
  });

  selectedDiv.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleDropdown(this, itemsDiv);
    }
  });

  itemsDiv.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const focusedOption = this.querySelector(":focus");
      if (focusedOption) {
        updateSelectedOption(
          focusedOption,
          timescaleSelect,
          selectedDiv,
          itemsDiv,
          handleTimescaleChange
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateOptions(this, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateOptions(this, 1);
    } else if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Escape"
    ) {
      e.preventDefault();
      closeDropdown(this);
    }
  });

  document.addEventListener("click", closeAllSelect);
}

function toggleDropdown(selectedDiv, itemsDiv) {
  const isOpen = !itemsDiv.classList.contains("select-hide");
  closeAllSelect();
  if (!isOpen) {
    itemsDiv.classList.remove("select-hide");
    selectedDiv.classList.add("select-arrow-active");
    const firstOption = itemsDiv.querySelector("div");
    if (firstOption) {
      firstOption.tabIndex = 0;
      firstOption.focus();
    }
  }
}

function closeDropdown(itemsDiv) {
  itemsDiv.classList.add("select-hide");
  const selectedDiv = itemsDiv.previousElementSibling;
  selectedDiv.classList.remove("select-arrow-active");
  selectedDiv.focus();
  Array.from(itemsDiv.children).forEach((child) => (child.tabIndex = -1));
}

function navigateOptions(itemsDiv, direction) {
  const options = itemsDiv.querySelectorAll("div");
  const currentIndex = Array.from(options).findIndex(
    (option) => option === document.activeElement
  );
  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = options.length - 1;
  if (nextIndex >= options.length) nextIndex = 0;
  options[currentIndex].tabIndex = -1;
  options[nextIndex].tabIndex = 0;
  options[nextIndex].focus();
}

function updateSelectedOption(
  clickedOption,
  select,
  selectedDiv,
  itemsDiv,
  handleTimescaleChange
) {
  const options = itemsDiv.getElementsByTagName("div");
  for (let i = 0; i < options.length; i++) {
    if (options[i] === clickedOption) {
      select.selectedIndex = i;
      selectedDiv.textContent = clickedOption.textContent;
      const newValue = select.options[i].value;
      handleTimescaleChange({ target: { value: newValue } });
      break;
    }
  }
  closeDropdown(itemsDiv);
}

function closeAllSelect(elmnt) {
  const selectItems = document.getElementsByClassName("select-items");
  const selectSelected = document.getElementsByClassName("select-selected");
  for (let i = 0; i < selectSelected.length; i++) {
    if (elmnt !== selectSelected[i]) {
      selectSelected[i].classList.remove("select-arrow-active");
    }
  }
  for (let i = 0; i < selectItems.length; i++) {
    if (elmnt !== selectItems[i]) {
      selectItems[i].classList.add("select-hide");
    }
  }
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

export function updateFullscreenIcons(isFullscreen) {
  const fullscreenButton = document.getElementById("fullscreen-button");

  if (isFullscreen) {
    fullscreenButton.classList.add("is-fullscreen");
    document.body.classList.add("fullscreen");
  } else {
    fullscreenButton.classList.remove("is-fullscreen");
    document.body.classList.remove("fullscreen");
  }
}
