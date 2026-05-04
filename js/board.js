const Board = (() => {
    let boardEl = null;
    let flipped = false;
    let selectedSquare = null;
    let legalMoves = [];
    let lastMove = null;
    let annotations = {};
    let perspective3D = true;
    let pieceSet = 'cburnett';
    let theme = 'classic';
    let dragPiece = null;
    let dragOffset = { x: 0, y: 0 };

    const THEMES = {
        classic: { light: '#f0d9b5', dark: '#b58863', border: '#3d2200' },
        obsidian: { light: '#aaaaaa', dark: '#333333', border: '#111111' },
        forest: { light: '#d4e8c2', dark: '#4a7c59', border: '#2a3d20' },
        royal: { light: '#dee3e6', dark: '#315991', border: '#1a2d4a' },
        'chesscom-light': { light: '#eeeed2', dark: '#baca44', border: '#9a9a5e' },
        'chesscom-dark': { light: '#99cc99', dark: '#557755', border: '#334433' },
        ocean: { light: '#e8f3ff', dark: '#7aa7d1', border: '#4a7a9f' },
        sunset: { light: '#ffd8a8', dark: '#d87f3e', border: '#9a4a1a' },
        midnight: { light: '#c8d4d8', dark: '#3c4d5c', border: '#1a2633' }
    };

    const PIECE_URLS = {
        cburnett: 'https://lichess1.org/assets/piece/cburnett/',
        alpha: 'https://lichess1.org/assets/piece/alpha/',
        merida: 'https://lichess1.org/assets/piece/merida/'
    };

    function getPieceImageUrl(piece) {
        const base = PIECE_URLS[pieceSet] || PIECE_URLS.cburnett;
        const colorChar = piece.color === ChessEngine.COLOR_WHITE ? 'w' : 'b';
        const pieceChars = { 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };
        return base + colorChar + pieceChars[piece.type] + '.svg';
    }

    function init(container) {
        boardEl = container;
        boardEl.innerHTML = '';
        boardEl.className = 'chess-board' + (perspective3D ? ' perspective-3d' : '');

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.className = 'square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
                sq.dataset.rank = r;
                sq.dataset.file = f;
                sq.addEventListener('click', () => onSquareClick(r, f));
                sq.addEventListener('contextmenu', (e) => { e.preventDefault(); onRightClick(r, f); });
                sq.addEventListener('mousedown', (e) => onMouseDown(e, r, f));
                sq.addEventListener('touchstart', (e) => onTouchStart(e, r, f), { passive: false });
                boardEl.appendChild(sq);
            }
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);

        applyTheme();
    }

    function applyTheme() {
        const t = THEMES[theme] || THEMES.classic;
        document.documentElement.style.setProperty('--sq-light', t.light);
        document.documentElement.style.setProperty('--sq-dark', t.dark);
        document.documentElement.style.setProperty('--board-border', t.border);
    }

    function setTheme(name) {
        theme = name;
        applyTheme();
        localStorage.setItem('regicide_theme', name);
    }

    function setPieceSet(name) {
        pieceSet = name;
        localStorage.setItem('regicide_pieceset', name);
        render(Game.getState());
    }

    function setPerspective(val) {
        perspective3D = val;
        if (boardEl) boardEl.classList.toggle('perspective-3d', val);
        localStorage.setItem('regicide_perspective', val);
    }

    function setFlipped(val) {
        flipped = val;
        if (boardEl) boardEl.classList.toggle('flipped', val);
        render(Game.getState());
    }

    function render(state) {
        if (!boardEl || !state) return;
        const squares = boardEl.querySelectorAll('.square');

        squares.forEach(sq => {
            const r = parseInt(sq.dataset.rank);
            const f = parseInt(sq.dataset.file);
            const displayR = flipped ? 7 - r : r;
            const displayF = flipped ? 7 - f : f;

            sq.style.gridRow = displayR + 1;
            sq.style.gridColumn = displayF + 1;

            sq.querySelectorAll('.piece-img, .move-dot, .capture-ring').forEach(el => el.remove());
            sq.classList.remove('selected', 'last-move', 'check', 'annotation-red', 'annotation-green', 'annotation-yellow', 'annotation-blue');

            const piece = state.board[r][f];
            if (piece) {
                const img = document.createElement('img');
                img.src = getPieceImageUrl(piece);
                img.className = 'piece-img';
                img.draggable = false;
                sq.appendChild(img);
            }

            if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === f) {
                sq.classList.add('selected');
            }

            if (lastMove) {
                if ((lastMove.from[0] === r && lastMove.from[1] === f) ||
                    (lastMove.to[0] === r && lastMove.to[1] === f)) {
                    sq.classList.add('last-move');
                }
            }

            const king = ChessEngine.findKing(state, state.turn);
            if (king && king[0] === r && king[1] === f && ChessEngine.isInCheck(state, state.turn)) {
                sq.classList.add('check');
            }

            if (annotations[r + ',' + f]) {
                sq.classList.add('annotation-' + annotations[r + ',' + f]);
            }

            const isLegal = legalMoves.some(m => m.to[0] === r && m.to[1] === f);
            if (isLegal) {
                const target = state.board[r][f];
                if (target) {
                    const ring = document.createElement('div');
                    ring.className = 'capture-ring';
                    sq.appendChild(ring);
                } else {
                    const dot = document.createElement('div');
                    dot.className = 'move-dot';
                    sq.appendChild(dot);
                }
            }
        });
    }

    function onSquareClick(r, f) {
        if (dragPiece) return;
        const state = Game.getState();
        if (!state || !Game.isActive()) return;

        // If a square is already selected, try to make the move
        if (selectedSquare) {
            // If clicking the same square, deselect it
            if (selectedSquare[0] === r && selectedSquare[1] === f) {
                selectedSquare = null;
                legalMoves = [];
                render(state);
                return;
            }
            
            // Try to make the move
            const result = Game.tryMove(selectedSquare, [r, f]);
            if (result && result.needsPromotion) {
                showPromotionDialog(selectedSquare, [r, f], state.turn);
                return;
            }
            if (result && result.executed) {
                lastMove = { from: selectedSquare, to: [r, f] };
                selectedSquare = null;
                legalMoves = [];
                render(state);
                return;
            }
            
            // If move wasn't legal, try selecting the new square instead
            selectedSquare = null;
            legalMoves = [];
        }

        // Select a new piece
        const piece = state.board[r][f];
        if (piece && piece.color === state.turn) {
            if (Game.getMode() === 'ai' && state.turn !== Game.getPlayerColor()) return;
            selectedSquare = [r, f];
            legalMoves = ChessEngine.generateLegalMoves(state, state.turn).filter(m => m.from[0] === r && m.from[1] === f);
        }
        render(state);
    }

    function onRightClick(r, f) {
        const key = r + ',' + f;
        const colors = ['red', 'green', 'yellow', 'blue'];
        const current = annotations[key];
        if (!current) {
            annotations[key] = 'red';
        } else {
            const idx = colors.indexOf(current);
            if (idx >= colors.length - 1) {
                delete annotations[key];
            } else {
                annotations[key] = colors[idx + 1];
            }
        }
        render(Game.getState());
    }

    function onMouseDown(e, r, f) {
        if (e.button !== 0) return;
        const state = Game.getState();
        if (!state || !Game.isActive()) return;
        const piece = state.board[r][f];
        if (!piece || piece.color !== state.turn) return;
        if (Game.getMode() === 'ai' && state.turn !== Game.getPlayerColor()) return;

        selectedSquare = [r, f];
        legalMoves = ChessEngine.generateLegalMoves(state, state.turn).filter(m => m.from[0] === r && m.from[1] === f);
        render(state);

        const sq = e.currentTarget;
        const img = sq.querySelector('.piece-img');
        if (img) {
            dragPiece = img.cloneNode(true);
            dragPiece.className = 'piece-img dragging';
            dragPiece.style.transition = 'none';
            dragPiece.style.filter = 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7))';
            document.body.appendChild(dragPiece);
            const rect = sq.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left - rect.width / 2;
            dragOffset.y = e.clientY - rect.top - rect.height / 2;
            dragPiece.style.left = (e.clientX - rect.width / 2) + 'px';
            dragPiece.style.top = (e.clientY - rect.height / 2) + 'px';
            img.style.opacity = '0.2';
        }
    }

    function onMouseMove(e) {
        if (!dragPiece) return;
        const size = boardEl.querySelector('.square').getBoundingClientRect().width;
        dragPiece.style.left = (e.clientX - size / 2) + 'px';
        dragPiece.style.top = (e.clientY - size / 2) + 'px';
        dragPiece.style.transform = 'scale(1.15)';
    }

    function onMouseUp(e) {
        if (!dragPiece) return;
        dragPiece.remove();
        dragPiece = null;

        const squares = boardEl.querySelectorAll('.square');
        let targetSq = null;
        squares.forEach(sq => {
            const rect = sq.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                targetSq = sq;
            }
        });

        if (targetSq && selectedSquare) {
            const r = parseInt(targetSq.dataset.rank);
            const f = parseInt(targetSq.dataset.file);
            if (r !== selectedSquare[0] || f !== selectedSquare[1]) {
                // Execute move directly from drag without calling onSquareClick
                const state = Game.getState();
                const result = Game.tryMove(selectedSquare, [r, f]);
                if (result && result.needsPromotion) {
                    showPromotionDialog(selectedSquare, [r, f], state.turn);
                    selectedSquare = null;
                    legalMoves = [];
                    render(state);
                    return;
                }
                if (result && result.executed) {
                    lastMove = { from: selectedSquare, to: [r, f] };
                    selectedSquare = null;
                    legalMoves = [];
                    render(state);
                    return;
                }
            }
        }
        
        selectedSquare = null;
        legalMoves = [];
        render(Game.getState());
    }

    function onTouchStart(e, r, f) {
        e.preventDefault();
        const touch = e.touches[0];
        onMouseDown({ button: 0, clientX: touch.clientX, clientY: touch.clientY, currentTarget: e.currentTarget }, r, f);
    }

    function onTouchMove(e) {
        if (!dragPiece) return;
        e.preventDefault();
        const touch = e.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    function onTouchEnd(e) {
        if (!dragPiece) return;
        const touch = e.changedTouches[0];
        onMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    }

    function showPromotionDialog(from, to, color) {
        const dialog = document.createElement('div');
        dialog.className = 'promotion-dialog';
        const pieces = [ChessEngine.PIECE_QUEEN, ChessEngine.PIECE_ROOK, ChessEngine.PIECE_BISHOP, ChessEngine.PIECE_KNIGHT];
        pieces.forEach(type => {
            const btn = document.createElement('button');
            const img = document.createElement('img');
            img.src = getPieceImageUrl({ type, color });
            btn.appendChild(img);
            btn.onclick = () => {
                dialog.remove();
                const result = Game.tryMove(from, to, type);
                if (result && result.executed) {
                    lastMove = { from, to };
                    selectedSquare = null;
                    legalMoves = [];
                    render(Game.getState());
                }
            };
            dialog.appendChild(btn);
        });
        boardEl.parentElement.appendChild(dialog);
    }

    function showThinking(show) {
        let indicator = document.getElementById('thinking-indicator');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'thinking-indicator';
                indicator.innerHTML = '<span>Thinking</span><span class="dots"><span>.</span><span>.</span><span>.</span></span>';
                document.querySelector('.game-info')?.appendChild(indicator);
            }
            indicator.style.display = 'flex';
        } else if (indicator) {
            indicator.style.display = 'none';
        }
    }

    function getLastMove() { return lastMove; }
    function setLastMove(m) { lastMove = m; render(Game.getState()); }
    function clearAnnotations() { annotations = {}; render(Game.getState()); }
    function getAvailableThemes() { return Object.keys(THEMES); }
    function clearSelection() { 
        selectedSquare = null; 
        legalMoves = [];
        render(Game.getState());
    }

    return {
        init, render, setFlipped, setPerspective, setTheme, setPieceSet,
        showThinking, showPromotionDialog, getLastMove, setLastMove, clearAnnotations, clearSelection,
        THEMES, PIECE_URLS, applyTheme, getAvailableThemes,
        get flipped() { return flipped; },
        get perspective3D() { return perspective3D; },
        get theme() { return theme; },
        get pieceSet() { return pieceSet; }
    };
})();
