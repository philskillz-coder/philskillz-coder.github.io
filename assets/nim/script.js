let boardState = []; 
let history = []; 
let currentPlayer = 1;
let selectedIndices = [];
let selectedRow = null;
let gameMode = 'misere';
let vsMode = 'ai';
let isBotThinking = false;

function initGame() {
    if (isBotThinking) return;
    const board = document.getElementById('board');
    const rowCount = parseInt(document.getElementById('rows-input').value) || 5;
    const pattern = document.getElementById('pattern-select').value;
    gameMode = document.getElementById('mode-select').value;
    vsMode = document.getElementById('vs-select').value;
    let startingOrder = document.getElementById('order-select').value;

    // Zufällige Startreihenfolge auflösen
    if (startingOrder === 'rand') {
        if (vsMode === 'ai') {
            startingOrder = Math.random() < 0.5 ? '1' : 'ai';
        } else {
            startingOrder = Math.random() < 0.5 ? '1' : '2';
        }
    }

    board.innerHTML = '';
    boardState = [];
    history = [];
    selectedIndices = [];
    selectedRow = null;
    
    document.getElementById('end-turn-btn').style.display = 'inline-block';
    document.getElementById('hint-btn').style.display = 'inline-block';
    document.getElementById('undo-btn').style.display = 'inline-block';

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const count = pattern === 'pyramid' ? (2 * rowIndex + 1) : (rowIndex + 1);
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        boardState[rowIndex] = [];

        for (let i = 0; i < count; i++) {
            boardState[rowIndex].push(false); 
            const circle = document.createElement('div');
            circle.className = 'circle';
            circle.dataset.row = rowIndex;
            circle.dataset.index = i;
            circle.onclick = () => { if(!isBotThinking) selectCircle(rowIndex, i, circle); };
            rowDiv.appendChild(circle);
        }
        board.appendChild(rowDiv);
    }

    if (vsMode === 'ai' && startingOrder === 'ai') {
        currentPlayer = 2;
        document.getElementById('status').innerText = "KI überlegt...";
        document.getElementById('game-analysis').innerText = "Berechne...";
        isBotThinking = true;
        setTimeout(makeAIMove, 600);
    } else {
        currentPlayer = parseInt(startingOrder) || 1;
        document.getElementById('status').innerText = vsMode === 'ai' ? "Du bist dran" : `Spieler ${currentPlayer} ist dran`;
        updateLiveAnalysis();
    }
}


function selectCircle(rowIndex, index, element) {
    if (boardState[rowIndex][index]) return;
    clearHintVisuals(); // Falls noch ein Tipp leuchtet, weg damit

    if (selectedRow === null) {
        selectedRow = rowIndex;
    } else if (selectedRow !== rowIndex) {
        alert("Du darfst nur Kreise aus derselben Reihe wählen!");
        return;
    }

    const pos = selectedIndices.indexOf(index);
    if (pos > -1) {
        selectedIndices.splice(pos, 1);
        element.classList.remove('selected');
        if (selectedIndices.length === 0) selectedRow = null;
    } else {
        const testIndices = [...selectedIndices, index].sort((a, b) => a - b);
        if (!isContiguous(testIndices, rowIndex, boardState)) {
            alert("Die Kreise müssen lückenlos nebeneinander liegen!");
            return;
        }
        selectedIndices = testIndices;
        element.classList.add('selected');
    }
}

function isContiguous(indices, rowIndex, state) {
    for (let i = 0; i < indices.length - 1; i++) {
        if (indices[i+1] - indices[i] !== 1) return false;
    }
    if (indices.length > 1) {
        for (let k = indices[0]; k <= indices[indices.length - 1]; k++) {
            if (state[rowIndex][k]) return false;
        }
    }
    return true;
}

function endTurn() {
    if (selectedIndices.length === 0) {
        alert("Wähle mindestens einen Kreis!");
        return;
    }

    history.push({
        player: currentPlayer,
        row: selectedRow,
        indices: [...selectedIndices]
    });

    selectedIndices.forEach(index => {
        boardState[selectedRow][index] = true;
        const circle = document.querySelector(`[data-row='${selectedRow}'][data-index='${index}']`);
        circle.classList.remove('selected', 'hint');
        circle.classList.add('crossed');
    });

    if (checkGameOver()) return;

    currentPlayer = currentPlayer === 1 ? 2 : 1;

    if (vsMode === 'ai' && currentPlayer === 2) {
        document.getElementById('status').innerText = "KI überlegt...";
        document.getElementById('game-analysis').innerText = "KI am Zug...";
        isBotThinking = true;
        setTimeout(makeAIMove, 500); 
    } else {
        document.getElementById('status').innerText = vsMode === 'ai' ? "Du bist dran" : `Spieler ${currentPlayer} ist dran`;
        updateLiveAnalysis();
    }

    selectedIndices = [];
    selectedRow = null;
}

function undoMove() {
    if (isBotThinking || history.length === 0) return;
    clearHintVisuals();

    function revertLast() {
        let lastMove = history.pop();
        if (!lastMove) return null;

        lastMove.indices.forEach(index => {
            boardState[lastMove.row][index] = false;
            const circle = document.querySelector(`[data-row='${lastMove.row}'][data-index='${index}']`);
            circle.classList.remove('crossed', 'selected', 'hint');
        });
        return lastMove.player;
    }

    if (vsMode === 'ai') {
        revertLast(); 
        let originalPlayer = revertLast(); 
        currentPlayer = originalPlayer || 1;
    } else {
        currentPlayer = revertLast();
    }

    document.getElementById('end-turn-btn').style.display = 'inline-block';
    document.getElementById('hint-btn').style.display = 'inline-block';
    document.getElementById('status').innerText = vsMode === 'ai' ? "Du bist dran" : `Spieler ${currentPlayer} ist dran`;
    
    updateLiveAnalysis();
    selectedIndices = [];
    selectedRow = null;
}

function checkGameOver() {
    if (boardState.flat().every(cell => cell === true)) {
        let winner;
        if (gameMode === 'misere') {
            winner = currentPlayer === 1 ? 2 : 1;
        } else {
            winner = currentPlayer;
        }
        
        let winnerName = `Spieler ${winner}`;
        if (vsMode === 'ai') {
            winnerName = winner === 2 ? "Die KI" : "Du hast";
        }
        
        document.getElementById('status').innerText = vsMode === 'ai' && winner === 1 ? "Du hast GEWONNEN!" : `${winnerName} GEWINNT!`;
        document.getElementById('game-analysis').innerText = "Spiel beendet.";
        document.getElementById('end-turn-btn').style.display = 'none';
        document.getElementById('hint-btn').style.display = 'none';
        return true;
    }
    return false;
}

// --- HINWEIS FUNKTIONEN ---

function clearHintVisuals() {
    document.querySelectorAll('.circle.hint').forEach(el => el.classList.remove('hint'));
}

function showBestMoveHint() {
    if (isBotThinking) return;
    clearHintVisuals();
    
    let bestMove = getBestMove(boardState, gameMode);
    if (bestMove) {
        bestMove.indices.forEach(index => {
            const circle = document.querySelector(`[data-row='${bestMove.row}'][data-index='${index}']`);
            if (circle) circle.classList.add('hint');
        });
    }
}

function updateLiveAnalysis() {
    let piles = getVirtualPiles(boardState);
    let nimSum = piles.reduce((acc, val) => acc ^ val, 0);
    let isWinningPosition = false;

    if (gameMode === 'normal') {
        isWinningPosition = (nimSum !== 0);
    } else {
        let moreThanOne = piles.filter(p => p > 1).length;
        if (moreThanOne === 0) {
            isWinningPosition = (piles.filter(p => p === 1).length % 2 === 0);
        } else {
            isWinningPosition = (nimSum !== 0);
        }
    }

    const p1 = (vsMode === 'ai') ? "Du hast" : "Spieler 1" + " hat";
    const p2 = (vsMode === 'ai') ? "Die KI hat" : "Spieler 2" + " hat";

    if (isWinningPosition) {
        document.getElementById('game-analysis').innerText = `Analyse: ${currentPlayer === 1 ? p1 : p2} eine mathematische Gewinnstrategie!`;
    } else {
        document.getElementById('game-analysis').innerText = `Analyse: ${currentPlayer === 1 ? p2 : p1} eine mathematische Gewinnstrategie!`;
    }
}

// --- KI LOGIK (MINIMAX / HEURISTIK) ---

function makeAIMove() {
    let bestMove = getBestMove(boardState, gameMode);
    
    if (bestMove) {
        history.push({
            player: 2,
            row: bestMove.row,
            indices: [...bestMove.indices]
        });

        bestMove.indices.forEach(index => {
            boardState[bestMove.row][index] = true;
            const circle = document.querySelector(`[data-row='${bestMove.row}'][data-index='${index}']`);
            circle.classList.add('crossed');
        });
    }

    isBotThinking = false;
    if (checkGameOver()) return;

    currentPlayer = 1;
    document.getElementById('status').innerText = vsMode === 'ai' ? "Du bist dran" : "Spieler 1 ist dran";
    updateLiveAnalysis();
    selectedIndices = [];
    selectedRow = null;
}

function getAllPossibleMoves(state) {
    let moves = [];
    for (let r = 0; r < state.length; r++) {
        let row = state[r];
        for (let start = 0; start < row.length; start++) {
            if (row[start]) continue;
            let currentMove = [];
            for (let end = start; end < row.length; end++) {
                if (row[end]) break; 
                currentMove.push(end);
                moves.push({ row: r, indices: [...currentMove] });
            }
        }
    }
    return moves;
}

function getBestMove(state, mode) {
    let moves = getAllPossibleMoves(state);
    if (moves.length === 0) return null;

    let totalCircles = state.flat().filter(c => !c).length;
    if (totalCircles > 8) {
        return getHeuristicMove(moves, state, mode);
    }

    let bestScore = -Infinity;
    let bestMove = moves[0];

    for (let move of moves) {
        let nextState = deepCopyBoard(state);
        move.indices.forEach(i => nextState[move.row][i] = true);

        let score = minimax(nextState, 0, false, -Infinity, Infinity, mode);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(state, depth, isMaximizing, alpha, beta, mode) {
    let isLeft = state.flat().filter(c => !c).length;
    if (isLeft === 0) {
        if (mode === 'misere') {
            return isMaximizing ? 100 - depth : -100 + depth;
        } else {
            return isMaximizing ? -100 + depth : 100 - depth;
        }
    }

    let moves = getAllPossibleMoves(state);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            let nextState = deepCopyBoard(state);
            move.indices.forEach(i => nextState[move.row][i] = true);
            let evaluation = minimax(nextState, depth + 1, false, alpha, beta, mode);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            let nextState = deepCopyBoard(state);
            move.indices.forEach(i => nextState[move.row][i] = true);
            let evaluation = minimax(nextState, depth + 1, true, alpha, beta, mode);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getHeuristicMove(moves, state, mode) {
    for (let move of moves) {
        let nextState = deepCopyBoard(state);
        move.indices.forEach(i => nextState[move.row][i] = true);
        
        let piles = getVirtualPiles(nextState);
        let nimSum = piles.reduce((acc, val) => acc ^ val, 0);

        if (mode === 'normal') {
            if (nimSum === 0) return move; 
        } else {
            let moreThanOne = piles.filter(p => p > 1).length;
            if (moreThanOne === 0) {
                let countOnes = piles.filter(p => p === 1).length;
                if (countOnes % 2 === 1) return move; 
            } else if (nimSum === 0) {
                return move;
            }
        }
    }
    return moves[Math.floor(Math.random() * moves.length)]; 
}

function getVirtualPiles(state) {
    let piles = [];
    state.forEach(row => {
        let currentSize = 0;
        row.forEach(cell => {
            if (!cell) { currentSize++; } 
            else { if (currentSize > 0) { piles.push(currentSize); currentSize = 0; } }
        });
        if (currentSize > 0) piles.push(currentSize);
    });
    return piles;
}

function deepCopyBoard(state) {
    return state.map(row => [...row]);
}

initGame();