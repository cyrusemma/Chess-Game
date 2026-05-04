const ChessEngine = (() => {
    const PIECE_NONE = 0;
    const PIECE_PAWN = 1;
    const PIECE_KNIGHT = 2;
    const PIECE_BISHOP = 3;
    const PIECE_ROOK = 4;
    const PIECE_QUEEN = 5;
    const PIECE_KING = 6;

    const COLOR_WHITE = 0;
    const COLOR_BLACK = 1;

    const PIECE_VALUES = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0 };

    const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    function createPiece(type, color) {
        return { type, color };
    }

    function createState() {
        return {
            board: Array(8).fill(null).map(() => Array(8).fill(null)),
            turn: COLOR_WHITE,
            castling: { K: true, Q: true, k: true, q: true },
            enPassant: null,
            halfmoveClock: 0,
            fullmoveNumber: 1,
            moveHistory: [],
            positionHistory: [],
            captured: { white: [], black: [] }
        };
    }

    function cloneState(state) {
        const newState = {
            board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
            turn: state.turn,
            castling: { ...state.castling },
            enPassant: state.enPassant ? [...state.enPassant] : null,
            halfmoveClock: state.halfmoveClock,
            fullmoveNumber: state.fullmoveNumber,
            moveHistory: [...state.moveHistory],
            positionHistory: [...state.positionHistory],
            captured: { white: [...state.captured.white], black: [...state.captured.black] }
        };
        return newState;
    }

    function parseFEN(fen) {
        const state = createState();
        const parts = fen.split(' ');
        const rows = parts[0].split('/');

        for (let rank = 0; rank < 8; rank++) {
            let file = 0;
            for (const ch of rows[rank]) {
                if (ch >= '1' && ch <= '8') {
                    file += parseInt(ch);
                } else {
                    const color = ch === ch.toUpperCase() ? COLOR_WHITE : COLOR_BLACK;
                    const pieceMap = { p: PIECE_PAWN, n: PIECE_KNIGHT, b: PIECE_BISHOP, r: PIECE_ROOK, q: PIECE_QUEEN, k: PIECE_KING };
                    state.board[rank][file] = createPiece(pieceMap[ch.toLowerCase()], color);
                    file++;
                }
            }
        }

        state.turn = parts[1] === 'w' ? COLOR_WHITE : COLOR_BLACK;

        state.castling = { K: false, Q: false, k: false, q: false };
        if (parts[2] !== '-') {
            for (const ch of parts[2]) {
                state.castling[ch] = true;
            }
        }

        if (parts[3] !== '-') {
            const file = parts[3].charCodeAt(0) - 97;
            const rank = 8 - parseInt(parts[3][1]);
            state.enPassant = [rank, file];
        }

        state.halfmoveClock = parseInt(parts[4]) || 0;
        state.fullmoveNumber = parseInt(parts[5]) || 1;

        return state;
    }

    function toFEN(state) {
        let fen = '';
        for (let rank = 0; rank < 8; rank++) {
            let empty = 0;
            for (let file = 0; file < 8; file++) {
                const piece = state.board[rank][file];
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) { fen += empty; empty = 0; }
                    const pieceChars = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
                    let ch = pieceChars[piece.type];
                    if (piece.color === COLOR_WHITE) ch = ch.toUpperCase();
                    fen += ch;
                }
            }
            if (empty > 0) fen += empty;
            if (rank < 7) fen += '/';
        }

        fen += ' ' + (state.turn === COLOR_WHITE ? 'w' : 'b');

        let castling = '';
        if (state.castling.K) castling += 'K';
        if (state.castling.Q) castling += 'Q';
        if (state.castling.k) castling += 'k';
        if (state.castling.q) castling += 'q';
        fen += ' ' + (castling || '-');

        if (state.enPassant) {
            fen += ' ' + String.fromCharCode(97 + state.enPassant[1]) + (8 - state.enPassant[0]);
        } else {
            fen += ' -';
        }

        fen += ' ' + state.halfmoveClock;
        fen += ' ' + state.fullmoveNumber;

        return fen;
    }

    function inBounds(rank, file) {
        return rank >= 0 && rank < 8 && file >= 0 && file < 8;
    }

    function isSquareAttacked(state, rank, file, byColor) {
        const dir = byColor === COLOR_WHITE ? 1 : -1;
        if (inBounds(rank + dir, file - 1)) {
            const p = state.board[rank + dir][file - 1];
            if (p && p.color === byColor && p.type === PIECE_PAWN) return true;
        }
        if (inBounds(rank + dir, file + 1)) {
            const p = state.board[rank + dir][file + 1];
            if (p && p.color === byColor && p.type === PIECE_PAWN) return true;
        }

        const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, df] of knightMoves) {
            const r = rank + dr, f = file + df;
            if (inBounds(r, f)) {
                const p = state.board[r][f];
                if (p && p.color === byColor && p.type === PIECE_KNIGHT) return true;
            }
        }

        const bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, df] of bishopDirs) {
            for (let i = 1; i < 8; i++) {
                const r = rank + dr * i, f = file + df * i;
                if (!inBounds(r, f)) break;
                const p = state.board[r][f];
                if (p) {
                    if (p.color === byColor && (p.type === PIECE_BISHOP || p.type === PIECE_QUEEN)) return true;
                    break;
                }
            }
        }

        const rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, df] of rookDirs) {
            for (let i = 1; i < 8; i++) {
                const r = rank + dr * i, f = file + df * i;
                if (!inBounds(r, f)) break;
                const p = state.board[r][f];
                if (p) {
                    if (p.color === byColor && (p.type === PIECE_ROOK || p.type === PIECE_QUEEN)) return true;
                    break;
                }
            }
        }

        const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, df] of kingMoves) {
            const r = rank + dr, f = file + df;
            if (inBounds(r, f)) {
                const p = state.board[r][f];
                if (p && p.color === byColor && p.type === PIECE_KING) return true;
            }
        }

        return false;
    }

    function findKing(state, color) {
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = state.board[r][f];
                if (p && p.type === PIECE_KING && p.color === color) return [r, f];
            }
        }
        return null;
    }

    function isInCheck(state, color) {
        const king = findKing(state, color);
        if (!king) return false;
        const enemy = color === COLOR_WHITE ? COLOR_BLACK : COLOR_WHITE;
        return isSquareAttacked(state, king[0], king[1], enemy);
    }

    function generatePseudoLegalMoves(state, color) {
        const moves = [];
        const direction = color === COLOR_WHITE ? -1 : 1;
        const startRank = color === COLOR_WHITE ? 6 : 1;
        const promoRank = color === COLOR_WHITE ? 0 : 7;

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const piece = state.board[r][f];
                if (!piece || piece.color !== color) continue;

                if (piece.type === PIECE_PAWN) {
                    const nr = r + direction;
                    if (inBounds(nr, f) && !state.board[nr][f]) {
                        if (nr === promoRank) {
                            [PIECE_QUEEN, PIECE_ROOK, PIECE_BISHOP, PIECE_KNIGHT].forEach(promo => {
                                moves.push({ from: [r, f], to: [nr, f], promotion: promo });
                            });
                        } else {
                            moves.push({ from: [r, f], to: [nr, f] });
                        }
                        if (r === startRank) {
                            const nr2 = r + direction * 2;
                            if (!state.board[nr2][f]) {
                                moves.push({ from: [r, f], to: [nr2, f] });
                            }
                        }
                    }
                    for (const df of [-1, 1]) {
                        const nf = f + df;
                        if (!inBounds(nr, nf)) continue;
                        const target = state.board[nr][nf];
                        if (target && target.color !== color) {
                            if (nr === promoRank) {
                                [PIECE_QUEEN, PIECE_ROOK, PIECE_BISHOP, PIECE_KNIGHT].forEach(promo => {
                                    moves.push({ from: [r, f], to: [nr, nf], promotion: promo });
                                });
                            } else {
                                moves.push({ from: [r, f], to: [nr, nf] });
                            }
                        }
                        if (state.enPassant && state.enPassant[0] === nr && state.enPassant[1] === nf) {
                            moves.push({ from: [r, f], to: [nr, nf], enPassant: true });
                        }
                    }
                } else if (piece.type === PIECE_KNIGHT) {
                    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                    for (const [dr, df] of knightMoves) {
                        const nr = r + dr, nf = f + df;
                        if (!inBounds(nr, nf)) continue;
                        const target = state.board[nr][nf];
                        if (!target || target.color !== color) {
                            moves.push({ from: [r, f], to: [nr, nf] });
                        }
                    }
                } else if (piece.type === PIECE_BISHOP || piece.type === PIECE_QUEEN) {
                    const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
                    for (const [dr, df] of dirs) {
                        for (let i = 1; i < 8; i++) {
                            const nr = r + dr * i, nf = f + df * i;
                            if (!inBounds(nr, nf)) break;
                            const target = state.board[nr][nf];
                            if (!target) {
                                moves.push({ from: [r, f], to: [nr, nf] });
                            } else {
                                if (target.color !== color) moves.push({ from: [r, f], to: [nr, nf] });
                                break;
                            }
                        }
                    }
                }
                if (piece.type === PIECE_ROOK || piece.type === PIECE_QUEEN) {
                    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                    for (const [dr, df] of dirs) {
                        for (let i = 1; i < 8; i++) {
                            const nr = r + dr * i, nf = f + df * i;
                            if (!inBounds(nr, nf)) break;
                            const target = state.board[nr][nf];
                            if (!target) {
                                moves.push({ from: [r, f], to: [nr, nf] });
                            } else {
                                if (target.color !== color) moves.push({ from: [r, f], to: [nr, nf] });
                                break;
                            }
                        }
                    }
                }
                if (piece.type === PIECE_KING) {
                    const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                    for (const [dr, df] of kingMoves) {
                        const nr = r + dr, nf = f + df;
                        if (!inBounds(nr, nf)) continue;
                        const target = state.board[nr][nf];
                        if (!target || target.color !== color) {
                            moves.push({ from: [r, f], to: [nr, nf] });
                        }
                    }
                    const enemy = color === COLOR_WHITE ? COLOR_BLACK : COLOR_WHITE;
                    const kingRank = color === COLOR_WHITE ? 7 : 0;
                    if (r === kingRank && f === 4) {
                        if ((color === COLOR_WHITE ? state.castling.K : state.castling.k)) {
                            if (!state.board[kingRank][5] && !state.board[kingRank][6]) {
                                if (!isSquareAttacked(state, kingRank, 4, enemy) &&
                                    !isSquareAttacked(state, kingRank, 5, enemy) &&
                                    !isSquareAttacked(state, kingRank, 6, enemy)) {
                                    moves.push({ from: [r, f], to: [kingRank, 6], castling: 'K' });
                                }
                            }
                        }
                        if ((color === COLOR_WHITE ? state.castling.Q : state.castling.q)) {
                            if (!state.board[kingRank][3] && !state.board[kingRank][2] && !state.board[kingRank][1]) {
                                if (!isSquareAttacked(state, kingRank, 4, enemy) &&
                                    !isSquareAttacked(state, kingRank, 3, enemy) &&
                                    !isSquareAttacked(state, kingRank, 2, enemy)) {
                                    moves.push({ from: [r, f], to: [kingRank, 2], castling: 'Q' });
                                }
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    function generateLegalMoves(state, color) {
        const pseudoMoves = generatePseudoLegalMoves(state, color || state.turn);
        const legalMoves = [];
        for (const move of pseudoMoves) {
            const newState = makeMove(state, move, true);
            if (!isInCheck(newState, color || state.turn)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }

    function makeMove(state, move, skipHistory) {
        const newState = cloneState(state);
        const [fromR, fromF] = move.from;
        const [toR, toF] = move.to;
        const piece = newState.board[fromR][fromF];
        const captured = newState.board[toR][toF];

        if (!skipHistory) {
            const notation = getMoveNotation(state, move);
            newState.moveHistory.push({ ...move, notation, captured: captured ? { ...captured } : null });
        }

        if (captured && !skipHistory) {
            if (piece.color === COLOR_WHITE) {
                newState.captured.white.push(captured);
            } else {
                newState.captured.black.push(captured);
            }
        }

        newState.board[toR][toF] = piece;
        newState.board[fromR][fromF] = null;

        if (move.enPassant) {
            const capturedRank = piece.color === COLOR_WHITE ? toR + 1 : toR - 1;
            const epCaptured = newState.board[capturedRank][toF];
            if (!skipHistory && epCaptured) {
                if (piece.color === COLOR_WHITE) {
                    newState.captured.white.push(epCaptured);
                } else {
                    newState.captured.black.push(epCaptured);
                }
            }
            newState.board[capturedRank][toF] = null;
        }

        if (move.promotion) {
            newState.board[toR][toF] = createPiece(move.promotion, piece.color);
        }

        if (move.castling) {
            const rank = piece.color === COLOR_WHITE ? 7 : 0;
            if (move.castling === 'K') {
                newState.board[rank][5] = newState.board[rank][7];
                newState.board[rank][7] = null;
            } else {
                newState.board[rank][3] = newState.board[rank][0];
                newState.board[rank][0] = null;
            }
        }

        newState.enPassant = null;
        if (piece.type === PIECE_PAWN && Math.abs(toR - fromR) === 2) {
            newState.enPassant = [(fromR + toR) / 2, fromF];
        }

        if (piece.type === PIECE_KING) {
            if (piece.color === COLOR_WHITE) {
                newState.castling.K = false;
                newState.castling.Q = false;
            } else {
                newState.castling.k = false;
                newState.castling.q = false;
            }
        }
        if (piece.type === PIECE_ROOK) {
            if (piece.color === COLOR_WHITE) {
                if (fromR === 7 && fromF === 7) newState.castling.K = false;
                if (fromR === 7 && fromF === 0) newState.castling.Q = false;
            } else {
                if (fromR === 0 && fromF === 7) newState.castling.k = false;
                if (fromR === 0 && fromF === 0) newState.castling.q = false;
            }
        }
        if (toR === 0 && toF === 7) newState.castling.k = false;
        if (toR === 0 && toF === 0) newState.castling.q = false;
        if (toR === 7 && toF === 7) newState.castling.K = false;
        if (toR === 7 && toF === 0) newState.castling.Q = false;

        if (piece.type === PIECE_PAWN || captured) {
            newState.halfmoveClock = 0;
        } else {
            newState.halfmoveClock++;
        }

        if (state.turn === COLOR_BLACK) {
            newState.fullmoveNumber++;
        }

        newState.turn = state.turn === COLOR_WHITE ? COLOR_BLACK : COLOR_WHITE;

        if (!skipHistory) {
            newState.positionHistory.push(toBoardKey(newState));
        }

        return newState;
    }

    function toBoardKey(state) {
        let key = '';
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = state.board[r][f];
                if (p) {
                    const pieceChars = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
                    key += (p.color === COLOR_WHITE ? pieceChars[p.type].toUpperCase() : pieceChars[p.type]);
                } else {
                    key += '.';
                }
            }
        }
        key += state.turn + JSON.stringify(state.castling) + JSON.stringify(state.enPassant);
        return key;
    }

    function getMoveNotation(state, move) {
        const [fromR, fromF] = move.from;
        const [toR, toF] = move.to;
        const piece = state.board[fromR][fromF];
        const captured = state.board[toR][toF] || move.enPassant;
        const fileChar = f => String.fromCharCode(97 + f);
        const rankChar = r => String(8 - r);

        if (move.castling === 'K') return 'O-O';
        if (move.castling === 'Q') return 'O-O-O';

        let notation = '';
        const pieceSymbols = { 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };

        if (piece.type === PIECE_PAWN) {
            if (captured) notation += fileChar(fromF);
        } else {
            notation += pieceSymbols[piece.type];
            const similar = generatePseudoLegalMoves(state, piece.color).filter(m => {
                const p = state.board[m.from[0]][m.from[1]];
                return p && p.type === piece.type && m.to[0] === toR && m.to[1] === toF &&
                    (m.from[0] !== fromR || m.from[1] !== fromF);
            });
            if (similar.length > 0) {
                if (similar.every(m => m.from[1] !== fromF)) {
                    notation += fileChar(fromF);
                } else if (similar.every(m => m.from[0] !== fromR)) {
                    notation += rankChar(fromR);
                } else {
                    notation += fileChar(fromF) + rankChar(fromR);
                }
            }
        }

        if (captured) notation += 'x';
        notation += fileChar(toF) + rankChar(toR);

        if (move.promotion) {
            const promoSymbols = { 2: 'N', 3: 'B', 4: 'R', 5: 'Q' };
            notation += '=' + promoSymbols[move.promotion];
        }

        const newState = makeMove(state, move, true);
        if (isInCheck(newState, newState.turn)) {
            const legalMoves = generateLegalMoves(newState, newState.turn);
            notation += legalMoves.length === 0 ? '#' : '+';
        }

        return notation;
    }

    function isCheckmate(state) {
        return isInCheck(state, state.turn) && generateLegalMoves(state, state.turn).length === 0;
    }

    function isStalemate(state) {
        return !isInCheck(state, state.turn) && generateLegalMoves(state, state.turn).length === 0;
    }

    function isFiftyMoveRule(state) {
        return state.halfmoveClock >= 100;
    }

    function isThreefoldRepetition(state) {
        const currentKey = toBoardKey(state);
        let count = 0;
        for (const key of state.positionHistory) {
            if (key === currentKey) count++;
        }
        return count >= 3;
    }

    function isInsufficientMaterial(state) {
        const pieces = { white: [], black: [] };
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const p = state.board[r][f];
                if (p && p.type !== PIECE_KING) {
                    pieces[p.color === COLOR_WHITE ? 'white' : 'black'].push(p);
                }
            }
        }
        if (pieces.white.length === 0 && pieces.black.length === 0) return true;
        if (pieces.white.length === 0 && pieces.black.length === 1 &&
            (pieces.black[0].type === PIECE_BISHOP || pieces.black[0].type === PIECE_KNIGHT)) return true;
        if (pieces.black.length === 0 && pieces.white.length === 1 &&
            (pieces.white[0].type === PIECE_BISHOP || pieces.white[0].type === PIECE_KNIGHT)) return true;
        if (pieces.white.length === 1 && pieces.black.length === 1 &&
            pieces.white[0].type === PIECE_BISHOP && pieces.black[0].type === PIECE_BISHOP) {
            let wBishopColor, bBishopColor;
            for (let r = 0; r < 8; r++) {
                for (let f = 0; f < 8; f++) {
                    const p = state.board[r][f];
                    if (p && p.type === PIECE_BISHOP) {
                        if (p.color === COLOR_WHITE) wBishopColor = (r + f) % 2;
                        else bBishopColor = (r + f) % 2;
                    }
                }
            }
            if (wBishopColor === bBishopColor) return true;
        }
        return false;
    }

    function isDraw(state) {
        return isStalemate(state) || isFiftyMoveRule(state) || isThreefoldRepetition(state) || isInsufficientMaterial(state);
    }

    function getGameResult(state) {
        if (isCheckmate(state)) return { result: 'checkmate', winner: state.turn === COLOR_WHITE ? COLOR_BLACK : COLOR_WHITE };
        if (isStalemate(state)) return { result: 'stalemate' };
        if (isFiftyMoveRule(state)) return { result: 'fifty-move' };
        if (isThreefoldRepetition(state)) return { result: 'threefold' };
        if (isInsufficientMaterial(state)) return { result: 'insufficient' };
        return null;
    }

    function toPGN(state, metadata = {}) {
        let pgn = '';
        pgn += `[Event "${metadata.event || 'Regicide Chess Game'}"]\n`;
        pgn += `[Site "Regicide Chess App"]\n`;
        pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
        pgn += `[White "${metadata.white || 'White'}"]\n`;
        pgn += `[Black "${metadata.black || 'Black'}"]\n`;
        const result = getGameResult(state);
        let resultStr = '*';
        if (result) {
            if (result.result === 'checkmate') resultStr = result.winner === COLOR_WHITE ? '1-0' : '0-1';
            else resultStr = '1/2-1/2';
        }
        pgn += `[Result "${resultStr}"]\n\n`;

        let moveText = '';
        for (let i = 0; i < state.moveHistory.length; i++) {
            if (i % 2 === 0) moveText += Math.floor(i / 2 + 1) + '. ';
            moveText += state.moveHistory[i].notation + ' ';
        }
        moveText += resultStr;
        pgn += moveText.trim();
        return pgn;
    }

    return {
        PIECE_NONE, PIECE_PAWN, PIECE_KNIGHT, PIECE_BISHOP, PIECE_ROOK, PIECE_QUEEN, PIECE_KING,
        COLOR_WHITE, COLOR_BLACK, PIECE_VALUES, INITIAL_FEN,
        createState, cloneState, parseFEN, toFEN,
        generateLegalMoves, makeMove, isInCheck, isCheckmate, isStalemate,
        isDraw, getGameResult, findKing, isSquareAttacked, toPGN, getMoveNotation,
        isFiftyMoveRule, isThreefoldRepetition, isInsufficientMaterial
    };
})();
