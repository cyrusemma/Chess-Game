const AIEasy = (() => {
    const PIECE_SQUARE_TABLES = {
        1: [ // Pawn
            [0,0,0,0,0,0,0,0],
            [50,50,50,50,50,50,50,50],
            [10,10,20,30,30,20,10,10],
            [5,5,10,25,25,10,5,5],
            [0,0,0,20,20,0,0,0],
            [5,-5,-10,0,0,-10,-5,5],
            [5,10,10,-20,-20,10,10,5],
            [0,0,0,0,0,0,0,0]
        ],
        2: [ // Knight
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,0,0,0,0,-20,-40],
            [-30,0,10,15,15,10,0,-30],
            [-30,5,15,20,20,15,5,-30],
            [-30,0,15,20,20,15,0,-30],
            [-30,5,10,15,15,10,5,-30],
            [-40,-20,0,5,5,0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        3: [ // Bishop
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,0,0,0,0,0,0,-10],
            [-10,0,10,10,10,10,0,-10],
            [-10,5,5,10,10,5,5,-10],
            [-10,0,10,10,10,10,0,-10],
            [-10,10,10,10,10,10,10,-10],
            [-10,5,0,0,0,0,5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        4: [ // Rook
            [0,0,0,0,0,0,0,0],
            [5,10,10,10,10,10,10,5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [0,0,0,5,5,0,0,0]
        ],
        5: [ // Queen
            [-20,-10,-10,-5,-5,-10,-10,-20],
            [-10,0,0,0,0,0,0,-10],
            [-10,0,5,5,5,5,0,-10],
            [-5,0,5,5,5,5,0,-5],
            [0,0,5,5,5,5,0,-5],
            [-10,5,5,5,5,5,0,-10],
            [-10,0,5,0,0,0,0,-10],
            [-20,-10,-10,-5,-5,-10,-10,-20]
        ],
        6: [ // King middlegame
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20,20,0,0,0,0,20,20],
            [20,30,10,0,0,10,30,20]
        ]
    };

    const MATERIAL_VALUES = { 1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 20000 };

    function evaluate(state) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = state.board[r][f];
                if (!p) continue;
                const material = MATERIAL_VALUES[p.type];
                const table = PIECE_SQUARE_TABLES[p.type];
                const tableRow = p.color === ChessEngine.COLOR_WHITE ? r : 7 - r;
                const positional = table[tableRow][f];
                const value = material + positional;
                score += p.color === ChessEngine.COLOR_WHITE ? value : -value;
            }
        }
        return score;
    }

    function minimax(state, depth, alpha, beta, maximizing) {
        if (depth === 0) return evaluate(state);

        const color = maximizing ? ChessEngine.COLOR_WHITE : ChessEngine.COLOR_BLACK;
        const moves = ChessEngine.generateLegalMoves(state, color);

        if (moves.length === 0) {
            if (ChessEngine.isInCheck(state, color)) return maximizing ? -99999 : 99999;
            return 0;
        }

        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newState = ChessEngine.makeMove(state, move, true);
                const eval_ = minimax(newState, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newState = ChessEngine.makeMove(state, move, true);
                const eval_ = minimax(newState, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function getBestMove(state, level) {
        const depthMap = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };
        const blunderChance = { 1: 0.4, 2: 0.3, 3: 0.2, 4: 0.1, 5: 0.05 };
        const depth = depthMap[level] || 2;
        const moves = ChessEngine.generateLegalMoves(state, state.turn);

        if (moves.length === 0) return null;

        if (Math.random() < blunderChance[level]) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        const maximizing = state.turn === ChessEngine.COLOR_WHITE;
        let bestMove = moves[0];
        let bestEval = maximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const newState = ChessEngine.makeMove(state, move, true);
            const eval_ = minimax(newState, depth - 1, -Infinity, Infinity, !maximizing);
            if (maximizing ? eval_ > bestEval : eval_ < bestEval) {
                bestEval = eval_;
                bestMove = move;
            }
        }
        return bestMove;
    }

    return { getBestMove, evaluate };
})();
