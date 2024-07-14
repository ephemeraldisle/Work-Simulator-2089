function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function normalizeTransition(transition) {
  return transition
    .split(",")
    .map((part) => {
      return part.trim().replace(/ 0s ease 0s| 0s ease| 0s/, "");
    })
    .join(", ");
}

async function runTests() {
  const testResults = document.getElementById("test-results");
  const timerBar = document.getElementById("timer");
  const swiper = document.getElementById("swiper");

  async function logResult(name, fn) {
    try {
      await fn();
      const result = document.createElement("div");
      result.className = "test-pass";
      result.textContent = `PASS: ${name}`;
      testResults.appendChild(result);
    } catch (error) {
      const result = document.createElement("div");
      result.className = "test-fail";
      result.textContent = `FAIL: ${name} - ${error.message}`;
      testResults.appendChild(result);
    }
  }

  function resetTestState() {
    timerBar.style.transition = "none";
    timerBar.style.width = "0%";
    swiper.style.transition = "none";
    swiper.style.left = SWIPER_INITIAL_POSITION;
    Game.characterPool = Game.getCharacterPool();
    Game.availableCharacters = [];
  }

  // Initial game initialization
  Game.initializeGame();

  // Test cases
  const tests = [
    {
      name: "Game should initialize correctly",
      fn: async () => {
        resetTestState();
        assert(typeof Game !== "undefined", "Game is not defined");
      },
    },
    {
      name: "startTimer should set correct timer duration",
      fn: async () => {
        resetTestState();
        const duration = 10;
        await Game.startTimer(duration);
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log("startTimer test - transition:", timerBar.style.transition);
        const expectedTransition = `width ${duration}s linear`;
        const actualTransition = normalizeTransition(timerBar.style.transition);
        assert(
          actualTransition === expectedTransition,
          `Expected: ${expectedTransition}, but got: ${actualTransition}`
        );
      },
    },
    {
      name: "endRoundEarly should adjust timer and swiper transitions",
      fn: async () => {
        resetTestState();
        await Game.endRoundEarly();
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(
          "endRoundEarly test - timer transition:",
          timerBar.style.transition
        );
        console.log(
          "endRoundEarly test - swiper transition:",
          swiper.style.transition
        );
        const expectedTimerTransition = "width 1s linear";
        const expectedSwiperTransition = "left 1s linear";
        const actualTimerTransition = normalizeTransition(
          timerBar.style.transition
        );
        const actualSwiperTransition = normalizeTransition(
          swiper.style.transition
        );
        assert(
          actualTimerTransition === expectedTimerTransition,
          `Expected: ${expectedTimerTransition}, but got: ${actualTimerTransition}`
        );
        assert(
          actualSwiperTransition === expectedSwiperTransition,
          `Expected: ${expectedSwiperTransition}, but got: ${actualSwiperTransition}`
        );
      },
    },
    {
      name: "resetRoundElements should reset timer and swiper",
      fn: async () => {
        resetTestState();
        await Game.resetRoundElements();
        console.log(
          "resetRoundElements test - timer transition:",
          timerBar.style.transition
        );
        console.log(
          "resetRoundElements test - swiper transition:",
          swiper.style.transition
        );
        const actualTimerTransition = normalizeTransition(
          timerBar.style.transition
        );
        const actualSwiperTransition = normalizeTransition(
          swiper.style.transition
        );
        assert(
          actualTimerTransition === "none",
          `Expected: 'none', but got: ${actualTimerTransition}`
        );
        assert(
          timerBar.style.width === "0%",
          `Expected: '0%', but got: ${timerBar.style.width}`
        );
        assert(
          actualSwiperTransition === "none",
          `Expected: 'none', but got: ${actualSwiperTransition}`
        );
        assert(
          swiper.style.left === "-300%",
          `Expected: '-300%', but got: ${swiper.style.left}`
        );
      },
    },
    {
      name: "calculateTotalValidCharacters should return correct count",
      fn: async () => {
        resetTestState();
        const totalValidCharacters = Game.calculateTotalValidCharacters();
        const expectedTotal = 341;
        assert(
          totalValidCharacters === expectedTotal,
          `Expected: ${expectedTotal}, but got: ${totalValidCharacters}`
        );
      },
    },
    {
      name: "populateCharacterPool should initialize character pool correctly",
      fn: async () => {
        resetTestState();
        const initialPoolSize = Math.ceil(
          Game.calculateTotalValidCharacters() * 0.01
        );
        console.log(
          "populateCharacterPool test - character pool size:",
          Game.getCharacterPool().length
        );
        console.log(
          "populateCharacterPool test - character pool:",
          Game.getCharacterPool()
        );
        assert(
          Game.getCharacterPool().length === initialPoolSize,
          `Expected: ${initialPoolSize}, but got: ${
            Game.getCharacterPool().length
          }`
        );
        const unlockedPercentage =
          document.getElementById("unlockedPercentage");
        const expectedPercentage = (
          (initialPoolSize / Game.calculateTotalValidCharacters()) *
          100
        ).toFixed(2);
        assert(
          unlockedPercentage.textContent.includes(`(${expectedPercentage}%)`),
          `Expected: (${expectedPercentage}%), but got: ${unlockedPercentage.textContent}`
        );
      },
    },
  ];

  for (const test of tests) {
    await logResult(test.name, test.fn);
  }
}

document.addEventListener("DOMContentLoaded", runTests);
