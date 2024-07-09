import { GRID_DEFAULT_ROWS, GRID_DEFAULT_COLS } from './constants.js';

export function initializeNavigation(state, elements) {
    addArrowKeySupport(state, elements);
    setupFullscreenButton(elements.fullscreenButton);
}

function addArrowKeySupport(state, elements) {
    document.addEventListener('keydown', function (e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const timescaleSelected = elements.timescaleControl.querySelector('.select-selected');
            
            if (timescaleSelected.classList.contains('select-arrow-active')) {
                // Let the timescale control handle its own navigation when the menu is open
                return;
            }

            e.preventDefault();

            const currentElement = document.activeElement;
            const gridCells = [...elements.gameGrid.querySelectorAll('.grid-cell.in-use')];

            if (gridCells.includes(currentElement)) {
                handleGridNavigation(e.key, currentElement, gridCells, elements, state);
            } else if (currentElement === timescaleSelected) {
                handleTimescaleNavigation(e.key, gridCells, elements, state);
            } else if (currentElement === elements.fullscreenButton) {
                handleFullscreenButtonNavigation(e.key, gridCells, elements, state);
            } else if (currentElement === elements.startGameButton) {
                handleStartGameButtonNavigation(e.key, elements, state);
            } else if ([elements.hintHolder, elements.characterDisplay, elements.scoreHolder].includes(currentElement)) {
                handleHeaderNavigation(e.key, currentElement, gridCells, elements, state);
            } else {
                // If nothing is focused, focus on an appropriate element
                focusInitialElement(e.key, elements, state);
            }
        }
    });
}


function focusInitialElement(key, elements, state) {
    switch (key) {
        case 'ArrowUp':
            elements.characterDisplay.focus();
            break;
        case 'ArrowDown':
            elements.gameGrid.querySelector('.grid-cell.in-use')?.focus() || elements.startGameButton.focus();
            break;
        case 'ArrowLeft':
            elements.fullscreenButton.focus();
            break;
        case 'ArrowRight':
            elements.timescaleControl.querySelector('.select-selected').focus();
            break;
    }
}



function handleGridNavigation(key, currentElement, gridCells, elements, state) {
    const currentIndex = gridCells.indexOf(currentElement);
    let nextIndex;

    switch (key) {
        case 'ArrowUp':
            if (currentIndex < state.cols) {
                navigateToHeader(currentIndex, elements, state);
            } else {
                nextIndex = currentIndex - state.cols;
            }
            break;
        case 'ArrowDown':
            nextIndex = currentIndex + state.cols;
            break;
        case 'ArrowLeft':
            nextIndex = currentIndex % state.cols === 0 ? currentIndex : currentIndex - 1;
            break;
        case 'ArrowRight':
            nextIndex = (currentIndex + 1) % state.cols === 0 ? currentIndex : currentIndex + 1;
            break;
    }

    if (nextIndex >= 0 && nextIndex < gridCells.length) {
        gridCells[nextIndex].focus();
    } else if (key === 'ArrowDown' && currentIndex >= (state.rows - 1) * state.cols) {
        if (currentIndex % state.cols === 0) {
            elements.fullscreenButton.focus();
        } else if (currentIndex === gridCells.length - 1) {
            elements.timescaleControl.querySelector('.select-selected').focus();
        } else {
            elements.startGameButton.focus();
        }
    } else if (key === 'ArrowRight' && currentIndex === gridCells.length - 1) {
        elements.timescaleControl.querySelector('.select-selected').focus();
    }
}


function navigateToHeader(currentIndex, elements, state) {
    const colIndex = currentIndex % state.cols;
    if (colIndex === 0) {
        elements.hintHolder.focus();
    } else if (colIndex === Math.floor(state.cols / 2)) {
        elements.characterDisplay.focus();
    } else {
        elements.scoreHolder.focus();
    }
}


function handleTimescaleNavigation(key, gridCells, elements, state) {
    switch (key) {
        case 'ArrowUp':
        case 'ArrowLeft':
            if (gridCells.length > 0) {
                gridCells[gridCells.length - 1].focus();
            } else {
                elements.startGameButton.focus();
            }
            break;
        case 'ArrowRight':
            elements.fullscreenButton.focus();
            break;
        case 'ArrowDown':
            elements.scoreHolder.focus();
            break;
    }
}



function handleFullscreenButtonNavigation(key, gridCells, elements, state) {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowUp':
            if (gridCells.length > 0) {
                gridCells[gridCells.length - state.cols].focus();
            } else {
                elements.startGameButton.focus();
            }
            break;
        case 'ArrowLeft':
            elements.timescaleControl.querySelector('.select-selected').focus();
            break;
        case 'ArrowDown':
            elements.hintHolder.focus();
            break;
    }
}




function handleStartGameButtonNavigation(key, elements, state) {
    switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
            elements.characterDisplay.focus();
            break;
        case 'ArrowLeft':
            elements.fullscreenButton.focus();
            break;
        case 'ArrowRight':
            elements.timescaleControl.querySelector('.select-selected').focus();
            break;
    }
}


function handleHeaderNavigation(key, currentElement, gridCells, elements, state) {
    switch (currentElement) {
        case elements.hintHolder:
            handleHintHolderNavigation(key, gridCells, elements);
            break;
        case elements.characterDisplay:
            handleCharacterDisplayNavigation(key, gridCells, elements, state);
            break;
        case elements.scoreHolder:
            handleScoreHolderNavigation(key, gridCells, elements, state);
            break;
    }
}



function handleHintHolderNavigation(key, gridCells, elements) {
    switch (key) {
        case 'ArrowUp':
            elements.fullscreenButton.focus();
            break;
        case 'ArrowRight':
            elements.characterDisplay.focus();
            break;
        case 'ArrowLeft':
            elements.scoreHolder.focus();
            break;
        case 'ArrowDown':
            gridCells[0]?.focus() || elements.startGameButton.focus();
            break;
    }
}

function handleCharacterDisplayNavigation(key, gridCells, elements, state) {
    const middleColIndex = Math.floor(state.cols / 2);
    switch (key) {
        case 'ArrowUp':
            gridCells[gridCells.length - state.cols + middleColIndex]?.focus() || elements.startGameButton.focus();
            break;
        case 'ArrowRight':
            elements.scoreHolder.focus();
            break;
        case 'ArrowLeft':
            elements.hintHolder.focus();
            break;
        case 'ArrowDown':
            gridCells[middleColIndex]?.focus() || elements.startGameButton.focus();
            break;
    }
}

function handleScoreHolderNavigation(key, gridCells, elements, state) {
    switch (key) {
        case 'ArrowUp':
            elements.timescaleControl.querySelector('.select-selected').focus();
            break;
        case 'ArrowRight':
            elements.hintHolder.focus();
            break;
        case 'ArrowLeft':
            elements.characterDisplay.focus();
            break;
        case 'ArrowDown':
            if (gridCells.length > 0) {
                gridCells[state.cols - 1].focus();
            } else {
                elements.startGameButton.focus();
            }
            break;
    }
}

function setupFullscreenButton(fullscreenButton) {
    fullscreenButton.addEventListener('click', toggleFullscreen);
}


function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            updateFullscreenButtonState(true);
        }).catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen().then(() => {
            updateFullscreenButtonState(false);
        });
    }
}

function updateFullscreenButtonState(isFullscreen) {
    const fullscreenIcon = document.querySelector('.fullscreen-icon');
    const exitFullscreenIcon = document.querySelector('.exit-fullscreen-icon');
    fullscreenIcon.style.display = isFullscreen ? 'none' : 'inline';
    exitFullscreenIcon.style.display = isFullscreen ? 'inline' : 'none';
    document.body.classList.toggle('fullscreen', isFullscreen);
}
