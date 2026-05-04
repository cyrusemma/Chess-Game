const AIStockfish = (() => {
    let worker = null;
    let ready = false;
    let resolveMove = null;

    function init() {
        return new Promise((resolve) => {
            if (worker) { resolve(); return; }
            worker = new Worker('https://cdn.jsdelivr.net/npm/stockfish@16/src/stockfish.js');
            worker.onmessage = (e) => {
                const line = e.data;
                if (line === 'uciok' || line === 'readyok') {
                    ready = true;
                    resolve();
                }
                if (resolveMove && typeof line === 'string' && line.startsWith('bestmove')) {
                    const parts = line.split(' ');
                    const moveStr = parts[1];
                    const r = resolveMove;
                    resolveMove = null;
                    r(moveStr);
                }
            };
            worker.postMessage('uci');
        });
    }

    function parseUCIMove(moveStr) {
        if (!moveStr || moveStr === '(none)') return null;
        const fromF = moveStr.charCodeAt(0) - 97;
        const fromR = 8 - parseInt(moveStr[1]);
        const toF = moveStr.charCodeAt(2) - 97;
        const toR = 8 - parseInt(moveStr[3]);
        const move = { from: [fromR, fromF], to: [toR, toF] };
        if (moveStr.length === 5) {
            const promoMap = { q: 5, r: 4, b: 3, n: 2 };
            move.promotion = promoMap[moveStr[4]];
        }
        return move;
    }

    function toUCIMove(move) {
        const files = 'abcdefgh';
        let str = files[move.from[1]] + (8 - move.from[0]) + files[move.to[1]] + (8 - move.to[0]);
        if (move.promotion) {
            const promoMap = { 5: 'q', 4: 'r', 3: 'b', 2: 'n' };
            str += promoMap[move.promotion];
        }
        return str;
    }

    async function getBestMove(state, level) {
        await init();
        const depthMap = { 6: 4, 7: 8, 8: 12, 9: 16, 10: 20 };
        const depth = depthMap[level] || 8;
        const fen = ChessEngine.toFEN(state);

        return new Promise((resolve) => {
            resolveMove = (moveStr) => {
                const parsed = parseUCIMove(moveStr);
                if (!parsed) { resolve(null); return; }
                const legalMoves = ChessEngine.generateLegalMoves(state, state.turn);
                const match = legalMoves.find(m =>
                    m.from[0] === parsed.from[0] && m.from[1] === parsed.from[1] &&
                    m.to[0] === parsed.to[0] && m.to[1] === parsed.to[1] &&
                    (!parsed.promotion || m.promotion === parsed.promotion)
                );
                resolve(match || legalMoves[0]);
            };
            worker.postMessage('position fen ' + fen);
            worker.postMessage('go depth ' + depth);
        });
    }

    return { init, getBestMove, toUCIMove, parseUCIMove };
})();
