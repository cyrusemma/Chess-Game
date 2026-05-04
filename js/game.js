const Game = (() => {
    let state = null;
    let mode = 'ai';
    let aiLevel = 3;
    let playerColor = ChessEngine.COLOR_WHITE;
    let gameActive = false;
    let onStateChange = null;
    let onGameEnd = null;
    let startFEN = null;
    let noPiecesLost = true;
    let moveHistory = []; // Track move history for undo
    let stateHistory = []; // Track game states for undo

    function init(options = {}) {
        mode = options.mode || 'ai';
        aiLevel = options.aiLevel || 3;
        playerColor = options.playerColor !== undefined ? options.playerColor : ChessEngine.COLOR_WHITE;
        startFEN = options.fen || ChessEngine.INITIAL_FEN;
        state = ChessEngine.parseFEN(startFEN);
        state.positionHistory = [toBoardKeyFull(state)];
        gameActive = true;
        noPiecesLost = true;
        moveHistory = [];
        stateHistory = [JSON.parse(JSON.stringify(state))];

        if (onStateChange) onStateChange(state);

        if (mode === 'ai' && state.turn !== playerColor) {
            setTimeout(doAIMove, 500);
        }
    }

    function toBoardKeyFull(s) {
        let key = '';
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = s.board[r][f];
                if (p) {
                    const chars = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
                    key += p.color === 0 ? chars[p.type].toUpperCase() : chars[p.type];
                } else key += '.';
            }
        }
        key += s.turn + JSON.stringify(s.castling) + JSON.stringify(s.enPassant);
        return key;
    }

    function tryMove(from, to, promotion) {
        if (!gameActive) return false;
        if (mode === 'ai' && state.turn !== playerColor) return false;
        if (mode === 'online' && state.turn !== playerColor) return false;

        const legalMoves = ChessEngine.generateLegalMoves(state, state.turn);
        let move = legalMoves.find(m =>
            m.from[0] === from[0] && m.from[1] === from[1] &&
            m.to[0] === to[0] && m.to[1] === to[1] &&
            (!m.promotion || m.promotion === promotion)
        );

        if (!move) {
            const promoMoves = legalMoves.filter(m =>
                m.from[0] === from[0] && m.from[1] === from[1] &&
                m.to[0] === to[0] && m.to[1] === to[1] && m.promotion
            );
            if (promoMoves.length > 0) {
                return { needsPromotion: true, moves: promoMoves };
            }
            return false;
        }

        const result = executeMove(move);
        if (result && result.executed && mode === 'online') {
            MultiplayerOnline.sendMove(move);
        }
        return result;
    }

    function executeMove(move) {
        const captured = state.board[move.to[0]][move.to[1]];
        if (captured && captured.color === playerColor) noPiecesLost = false;
        if (move.enPassant) noPiecesLost = false;

        // Save current state before making the move
        stateHistory.push(JSON.parse(JSON.stringify(state)));
        moveHistory.push(move);

        state = ChessEngine.makeMove(state, move);

        if (move.castling) {
            SoundEngine.castle();
            Profile.recordCastle();
        } else if (move.promotion) {
            SoundEngine.promotion();
            Profile.recordPromotion();
        } else if (captured || move.enPassant) {
            SoundEngine.capture();
        } else {
            SoundEngine.move();
        }

        if (ChessEngine.isInCheck(state, state.turn)) {
            SoundEngine.check();
        }

        if (onStateChange) onStateChange(state);

        const result = ChessEngine.getGameResult(state);
        if (result) {
            endGame(result);
            return { executed: true, result };
        }

        if (mode === 'ai' && state.turn !== playerColor && gameActive) {
            setTimeout(doAIMove, 600 + Math.random() * 900);
        }

        return { executed: true };
    }

    async function doAIMove() {
        if (!gameActive || state.turn === playerColor) return;

        Board.showThinking(true);
        let move;

        if (aiLevel <= 5) {
            await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
            move = AIEasy.getBestMove(state, aiLevel);
        } else {
            move = await AIStockfish.getBestMove(state, aiLevel);
        }

        Board.showThinking(false);

        if (!move || !gameActive) return;

        const captured = state.board[move.to[0]][move.to[1]];
        if (captured && captured.color === playerColor) noPiecesLost = false;

        // Track state before AI move
        stateHistory.push(JSON.parse(JSON.stringify(state)));
        moveHistory.push(move);

        state = ChessEngine.makeMove(state, move);

        if (move.castling) SoundEngine.castle();
        else if (move.promotion) SoundEngine.promotion();
        else if (captured || move.enPassant) SoundEngine.capture();
        else SoundEngine.move();

        if (ChessEngine.isInCheck(state, state.turn)) SoundEngine.check();
        if (onStateChange) onStateChange(state);

        const result = ChessEngine.getGameResult(state);
        if (result) endGame(result);
    }

    function endGame(result) {
        gameActive = false;
        let playerResult = 'draw';
        if (result.result === 'checkmate') {
            if (result.winner === playerColor) {
                playerResult = 'win';
                SoundEngine.victory();
            } else {
                playerResult = 'loss';
                SoundEngine.defeat();
            }
        }

        if (mode === 'ai' && playerResult === 'win' && noPiecesLost) {
            Profile.unlock('silent_storm');
        }

        const record = Profile.recordGame(playerResult, mode, aiLevel);
        if (onGameEnd) onGameEnd(result, record);
    }

    function resign() {
        if (!gameActive) return;
        gameActive = false;
        const result = { result: 'resign', winner: state.turn === ChessEngine.COLOR_WHITE ? ChessEngine.COLOR_BLACK : ChessEngine.COLOR_WHITE };
        const record = Profile.recordGame('loss', mode, aiLevel);
        SoundEngine.defeat();
        if (onGameEnd) onGameEnd(result, record);
    }

    function undo() {
        if (!gameActive || moveHistory.length === 0) return false;

        // In AI mode, undo the AI's response + player's last move (go back 2 moves)
        // In local mode, just undo the last move
        const undoCount = mode === 'ai' ? 2 : 1;
        
        for (let i = 0; i < undoCount; i++) {
            if (stateHistory.length > 0) {
                state = JSON.parse(JSON.stringify(stateHistory.pop()));
                moveHistory.pop();
            } else {
                return false;
            }
        }

        // Re-enable the piece lost check since we're going back
        noPiecesLost = true;
        for (let i = 0; i < moveHistory.length; i++) {
            const move = moveHistory[i];
            const captured = state.board[move.to[0]][move.to[1]];
            if (captured && captured.color === playerColor) noPiecesLost = false;
            if (move.enPassant) noPiecesLost = false;
        }

        if (onStateChange) onStateChange(state);
        return true;
    }

    function canUndo() {
        if (!gameActive || moveHistory.length === 0) return false;
        const requiredMoves = mode === 'ai' ? 2 : 1;
        return moveHistory.length >= requiredMoves;
    }

    function getState() { return state; }
    function isActive() { return gameActive; }
    function getMode() { return mode; }
    function getAILevel() { return aiLevel; }
    function getPlayerColor() { return playerColor; }
    function setOnStateChange(fn) { onStateChange = fn; }
    function setOnGameEnd(fn) { onGameEnd = fn; }

    return { init, tryMove, executeMove, resign, undo, canUndo, getState, isActive, getMode, getAILevel, getPlayerColor, setOnStateChange, setOnGameEnd };
})();
