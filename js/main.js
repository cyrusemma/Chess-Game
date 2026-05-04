const App = (() => {
    let currentScreen = 'home';

    function init() {
        loadSettings();
        renderScreen('home');
        updateProfileWidget();

        document.addEventListener('keydown', (e) => {
            if (currentScreen === 'analysis') {
                if (e.key === 'ArrowLeft') { Analysis.prev(); renderAnalysisBoard(); }
                if (e.key === 'ArrowRight') { Analysis.next(); renderAnalysisBoard(); }
            }
        });
    }

    function loadSettings() {
        const theme = localStorage.getItem('regicide_theme') || 'chesscom-light';
        const pieceset = localStorage.getItem('regicide_pieceset') || 'cburnett';
        const sound = localStorage.getItem('regicide_sound') !== 'false';
        const volume = parseFloat(localStorage.getItem('regicide_volume') || '0.7');
        const animations = localStorage.getItem('regicide_animations') !== 'false';

        Board.setTheme(theme);
        Board.setPieceSet(pieceset);
        SoundEngine.setEnabled(sound);
        SoundEngine.setVolume(volume);
        Animations.setEnabled(animations);
    }

    function renderScreen(screen) {
        currentScreen = screen;
        const app = document.getElementById('app');
        app.className = 'screen-' + screen;

        switch (screen) {
            case 'home': renderHome(app); break;
            case 'setup': renderSetup(app); break;
            case 'game': renderGame(app); break;
            case 'game-end': renderGameEnd(app); break;
            case 'analysis': renderAnalysis(app); break;
            case 'puzzles': renderPuzzles(app); break;
            case 'editor': renderEditor(app); break;
            case 'settings': renderSettings(app); break;
            case 'profile': renderProfile(app); break;
            case 'online-setup': renderOnlineSetup(app); break;
            default: renderHome(app);
        }
    }

    function updateProfileWidget() {
        const widget = document.getElementById('profile-widget');
        if (!widget) return;
        const profile = Profile.load();
        const progress = Profile.getXPProgress(profile);
        widget.innerHTML = `
            <div class="avatar" onclick="App.renderScreen('profile')">${profile.username[0].toUpperCase()}</div>
            <div class="profile-info">
                <span class="level">Lv.${profile.level}</span>
                <div class="xp-bar-mini"><div class="xp-fill" style="width:${progress.percent}%"></div></div>
            </div>
        `;
    }

    function renderHome(app) {
        app.innerHTML = `
            <div class="screen home-screen">
                <div class="floating-pieces"></div>
                <header>
                    <div id="profile-widget" class="profile-widget"></div>
                </header>
                <div class="home-content">
                    <div class="logo">
                        <span class="logo-icon">♚</span>
                        <h1>Regicide Chess</h1>
                    </div>
                    <nav class="menu">
                        <button onclick="App.showSetup('ai')">Play vs AI</button>
                        <button onclick="App.showSetup('local')">Play vs Friend</button>
                        <button onclick="App.renderScreen('online-setup')">Play Online</button>
                        <button onclick="App.renderScreen('puzzles')">Puzzles</button>
                        <button onclick="App.renderScreen('editor')">Board Editor</button>
                        <button onclick="App.renderScreen('settings')">Settings</button>
                    </nav>
                </div>
            </div>
        `;
        updateProfileWidget();
        createFloatingPieces(app.querySelector('.floating-pieces'));
    }

    function createFloatingPieces(container) {
        if (!container) return;
        const pieces = ['♔','♕','♖','♗','♘','♙','♚','♛','♜','♝','♞','♟'];
        for (let i = 0; i < 8; i++) {
            const el = document.createElement('div');
            el.className = 'floating-piece';
            el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
            el.style.left = Math.random() * 100 + '%';
            el.style.animationDelay = Math.random() * 20 + 's';
            el.style.animationDuration = (15 + Math.random() * 20) + 's';
            container.appendChild(el);
        }
    }

    function showSetup(mode) {
        renderScreen('setup');
        document.getElementById('setup-mode').value = mode;
        const aiOptions = document.getElementById('ai-options');
        const localOptions = document.getElementById('local-options');
        if (aiOptions) aiOptions.style.display = mode === 'ai' ? 'block' : 'none';
        if (localOptions) localOptions.style.display = mode === 'local' ? 'block' : 'none';
    }

    function renderSetup(app) {
        app.innerHTML = `
            <div class="screen setup-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Game Setup</h2>
                <input type="hidden" id="setup-mode" value="ai">
                <div id="ai-options" class="setup-section">
                    <label>Difficulty</label>
                    <div class="difficulty-grid">
                        ${[1,2,3,4,5,6,7,8,9,10].map(l => {
                            const names = ['Peasant','Squire','Knight','Bishop','Rook','Chancellor','Lord','Duke','Grand Master','The King'];
                            return `<button class="diff-btn" data-level="${l}" onclick="document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
                                <span class="diff-level">${l}</span>
                                <span class="diff-name">${names[l-1]}</span>
                            </button>`;
                        }).join('')}
                    </div>
                </div>
                <div id="local-options" class="setup-section" style="display:none">
                    <label>Player 1 (White)</label>
                    <input type="text" id="player1-name" value="Player 1" class="text-input">
                    <label>Player 2 (Black)</label>
                    <input type="text" id="player2-name" value="Player 2" class="text-input">
                </div>
                <div class="setup-section">
                    <label>Play as</label>
                    <div class="color-picker">
                        <button class="color-btn active" data-color="white" onclick="selectColor('white')">♔ White</button>
                        <button class="color-btn" data-color="black" onclick="selectColor('black')">♚ Black</button>
                        <button class="color-btn" data-color="random" onclick="selectColor('random')">🎲 Random</button>
                    </div>
                </div>
                <button class="start-btn" onclick="App.startGame()">Start Game</button>
            </div>
        `;
        setTimeout(() => {
            const firstDiff = document.querySelector('.diff-btn[data-level="3"]');
            if (firstDiff) firstDiff.classList.add('active');
        }, 0);
    }

    window.selectColor = function(color) {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.color-btn[data-color="${color}"]`).classList.add('active');
    };

    function startGame() {
        const mode = document.getElementById('setup-mode').value;
        const activeDiff = document.querySelector('.diff-btn.active');
        const aiLevel = activeDiff ? parseInt(activeDiff.dataset.level) : 3;
        const colorBtn = document.querySelector('.color-btn.active');
        let colorChoice = colorBtn ? colorBtn.dataset.color : 'white';
        if (colorChoice === 'random') colorChoice = Math.random() < 0.5 ? 'white' : 'black';
        const playerColor = colorChoice === 'white' ? ChessEngine.COLOR_WHITE : ChessEngine.COLOR_BLACK;

        if (mode === 'local') {
            const p1 = document.getElementById('player1-name')?.value || 'Player 1';
            const p2 = document.getElementById('player2-name')?.value || 'Player 2';
            MultiplayerLocal.init({ player1: p1, player2: p2 });
        } else {
            Game.init({ mode: 'ai', aiLevel, playerColor });
        }

        Game.setOnStateChange((state) => {
            if (currentScreen === 'game') {
                Board.render(state);
                updateGameInfo(state);
            }
        });
        Game.setOnGameEnd((result, record) => {
            setTimeout(() => renderGameEnd(document.getElementById('app'), result, record), 500);
        });

        renderScreen('game');
        if (playerColor === ChessEngine.COLOR_BLACK) Board.setFlipped(true);
        else Board.setFlipped(false);
    }

    function renderGame(app) {
        const state = Game.getState();
        app.innerHTML = `
            <div class="screen game-screen">
                <div class="game-layout">
                    <div class="game-left-panel clay-panel">
                        <div class="captured-tray top" id="captured-top"></div>
                        <div class="game-controls">
                            <button id="undo-btn" onclick="if(Game.canUndo()){Game.undo();Board.clearSelection();renderScreen('game')}" ${!Game.canUndo() ? 'disabled' : ''}>↶ Undo</button>
                            <button onclick="Game.resign()">⚐ Resign</button>
                        </div>
                    </div>
                    <div class="board-wrapper">
                        <div class="board-frame">
                            <div class="coord-labels rank-labels">
                                ${[8,7,6,5,4,3,2,1].map(n => `<span>${n}</span>`).join('')}
                            </div>
                            <div id="board-container" class="board-container"></div>
                            <div class="coord-labels file-labels">
                                ${['a','b','c','d','e','f','g','h'].map(l => `<span>${l}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="game-info clay-panel">
                        <div class="turn-indicator" id="turn-indicator"></div>
                        <div class="move-history" id="move-history"></div>
                        <div class="captured-tray bottom" id="captured-bottom"></div>
                    </div>
                </div>
            </div>
        `;
        Board.init(document.getElementById('board-container'));
        Board.render(state);
        updateGameInfo(state);
    }

    function updateGameInfo(state) {
        if (!state) return;
        const turnEl = document.getElementById('turn-indicator');
        if (turnEl) {
            const name = state.turn === ChessEngine.COLOR_WHITE ? 'White' : 'Black';
            turnEl.innerHTML = `<span class="turn-dot ${name.toLowerCase()}"></span> ${name} to move`;
        }

        const historyEl = document.getElementById('move-history');
        if (historyEl) {
            let html = '';
            for (let i = 0; i < state.moveHistory.length; i += 2) {
                const moveNum = Math.floor(i / 2) + 1;
                const whiteMove = state.moveHistory[i]?.notation || '';
                const blackMove = state.moveHistory[i + 1]?.notation || '';
                html += `<div class="move-row"><span class="move-num">${moveNum}.</span><span class="move white-move">${whiteMove}</span><span class="move black-move">${blackMove}</span></div>`;
            }
            historyEl.innerHTML = html;
            historyEl.scrollTop = historyEl.scrollHeight;
        }

        updateCapturedPieces(state);
    }

    function updateCapturedPieces(state) {
        const topEl = document.getElementById('captured-top');
        const bottomEl = document.getElementById('captured-bottom');
        if (!topEl || !bottomEl) return;

        const renderCaptures = (pieces) => {
            const sorted = [...pieces].sort((a, b) => (ChessEngine.PIECE_VALUES[b.type] || 0) - (ChessEngine.PIECE_VALUES[a.type] || 0));
            return sorted.map(p => `<img class="captured-piece" src="${getPieceUrl(p)}">`).join('');
        };

        topEl.innerHTML = renderCaptures(state.captured.black);
        bottomEl.innerHTML = renderCaptures(state.captured.white);
    }

    function getPieceUrl(piece) {
        const pieceset = localStorage.getItem('regicide_pieceset') || 'cburnett';
        const base = Board.PIECE_URLS[pieceset] || Board.PIECE_URLS.cburnett;
        const colorChar = piece.color === ChessEngine.COLOR_WHITE ? 'w' : 'b';
        const pieceChars = { 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };
        return base + colorChar + pieceChars[piece.type] + '.svg';
    }

    function renderGameEnd(app, result, record) {
        currentScreen = 'game-end';
        if (!result) return;

        let title = '', subtitle = '';
        if (result.result === 'checkmate') {
            title = result.winner === Game.getPlayerColor() ? 'Victory!' : 'Defeat';
            subtitle = 'Checkmate';
        } else if (result.result === 'resign') {
            title = 'Game Over';
            subtitle = 'Resignation';
        } else {
            title = 'Draw';
            subtitle = result.result === 'stalemate' ? 'Stalemate' :
                       result.result === 'fifty-move' ? '50-Move Rule' :
                       result.result === 'threefold' ? 'Threefold Repetition' : 'Insufficient Material';
        }

        const profile = Profile.load();
        const progress = Profile.getXPProgress(profile);
        const xpEarned = record ? record.xpEarned : 0;

        app.innerHTML = `
            <div class="screen game-end-screen">
                <div class="end-content">
                    ${result.winner !== undefined ? '<div class="crown-animation">👑</div>' : ''}
                    <h1>${title}</h1>
                    <p class="end-subtitle">${subtitle}</p>
                    <div class="xp-reward">
                        <span>+${xpEarned} XP</span>
                        <div class="xp-bar"><div class="xp-fill" id="end-xp-fill"></div></div>
                        <span class="level-label">Level ${profile.level}</span>
                    </div>
                    <div class="end-buttons">
                        <button onclick="App.renderScreen('analysis')">Analyze Game</button>
                        <button onclick="App.startGame()">Play Again</button>
                        <button onclick="App.renderScreen('home')">Home</button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const fill = document.getElementById('end-xp-fill');
            if (fill) Animations.xpBarFill(fill, progress.percent);
        }, 100);
    }

    function renderAnalysis(app) {
        const state = Game.getState();
        if (state) Analysis.load(state);

        app.innerHTML = `
            <div class="screen analysis-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Game Analysis</h2>
                <div class="analysis-layout">
                    <div class="eval-bar" id="eval-bar"><div class="eval-fill" id="eval-fill"></div></div>
                    <div id="analysis-board" class="board-container"></div>
                    <div class="analysis-panel">
                        <div class="analysis-controls">
                            <button onclick="Analysis.first();App.renderAnalysisBoard()">⏮</button>
                            <button onclick="Analysis.prev();App.renderAnalysisBoard()">◀</button>
                            <button onclick="Analysis.next();App.renderAnalysisBoard()">▶</button>
                            <button onclick="Analysis.last();App.renderAnalysisBoard()">⏭</button>
                        </div>
                        <div class="analysis-moves" id="analysis-moves"></div>
                        <button class="export-btn" onclick="App.exportPGN()">Export PGN</button>
                    </div>
                </div>
            </div>
        `;

        const boardEl = document.getElementById('analysis-board');
        renderAnalysisBoardOnly(boardEl, Analysis.goTo(0));
        renderAnalysisMoves();
        updateEvalBar();
    }

    function renderAnalysisBoard() {
        const pos = Analysis.goTo(Analysis.getCurrentIndex());
        const boardEl = document.getElementById('analysis-board');
        if (boardEl) renderAnalysisBoardOnly(boardEl, pos);
        updateAnalysisMoveHighlight();
        updateEvalBar();
    }

    function renderAnalysisBoardOnly(container, state) {
        if (!container || !state) return;
        container.innerHTML = '';
        container.className = 'board-container chess-board';
        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.className = 'square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
                sq.style.gridRow = r + 1;
                sq.style.gridColumn = f + 1;
                const piece = state.board[r][f];
                if (piece) {
                    const img = document.createElement('img');
                    img.src = getPieceUrl(piece);
                    img.className = 'piece-img';
                    img.draggable = false;
                    sq.appendChild(img);
                }
                container.appendChild(sq);
            }
        }
    }

    function renderAnalysisMoves() {
        const movesEl = document.getElementById('analysis-moves');
        if (!movesEl) return;
        const moves = Analysis.getMoves();
        let html = '';
        for (let i = 0; i < moves.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const w = moves[i];
            const b = moves[i + 1];
            const wClass = w?.quality || 'good';
            const bClass = b?.quality || 'good';
            html += `<div class="move-row">
                <span class="move-num">${moveNum}.</span>
                <span class="move quality-${wClass}" onclick="Analysis.goTo(${i+1});App.renderAnalysisBoard()">${w?.notation || ''}</span>
                <span class="move quality-${bClass}" onclick="Analysis.goTo(${i+2});App.renderAnalysisBoard()">${b?.notation || ''}</span>
            </div>`;
        }
        movesEl.innerHTML = html;
    }

    function updateAnalysisMoveHighlight() {
        const movesEl = document.getElementById('analysis-moves');
        if (!movesEl) return;
        movesEl.querySelectorAll('.move').forEach((el, i) => el.classList.remove('current'));
    }

    function updateEvalBar() {
        const fill = document.getElementById('eval-fill');
        if (!fill) return;
        const eval_ = Analysis.getEvaluation();
        fill.style.height = eval_.whitePercent + '%';
    }

    function exportPGN() {
        const state = Game.getState();
        if (!state) return;
        const pgn = ChessEngine.toPGN(state);
        navigator.clipboard.writeText(pgn).then(() => alert('PGN copied to clipboard!'));
    }

    function renderPuzzles(app) {
        const puzzles = Puzzles.getPuzzles();
        const daily = Puzzles.getDailyPuzzle();

        app.innerHTML = `
            <div class="screen puzzles-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Puzzles</h2>
                <div class="puzzle-streak">Streak: ${Puzzles.getStreak()} 🔥</div>
                <div class="puzzle-grid">
                    <div class="puzzle-card daily" onclick="App.startPuzzle(${daily})">
                        <span class="daily-badge">Daily Puzzle</span>
                        <span class="puzzle-theme">${puzzles[daily].theme}</span>
                        <span class="puzzle-diff">${'★'.repeat(puzzles[daily].difficulty)}</span>
                    </div>
                    ${puzzles.map((p, i) => `
                        <div class="puzzle-card" onclick="App.startPuzzle(${i})">
                            <span class="puzzle-num">#${i + 1}</span>
                            <span class="puzzle-theme">${p.theme}</span>
                            <span class="puzzle-diff">${'★'.repeat(p.difficulty)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function startPuzzle(index) {
        const state = Puzzles.startPuzzle(index);
        const puzzle = Puzzles.PUZZLE_BANK[index];
        currentScreen = 'puzzle-play';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen puzzle-play-screen">
                <button class="back-btn" onclick="App.renderScreen('puzzles')">← Back</button>
                <div class="puzzle-info">
                    <h3>${puzzle.theme}</h3>
                    <span class="puzzle-diff">${'★'.repeat(puzzle.difficulty)}</span>
                    <span class="puzzle-streak-badge">Streak: ${Puzzles.getStreak()} 🔥</span>
                </div>
                <div class="board-wrapper">
                    <div id="puzzle-board" class="board-container"></div>
                </div>
                <div class="puzzle-controls">
                    <button onclick="App.puzzleHint()" id="hint-btn">💡 Hint</button>
                    <div id="puzzle-feedback"></div>
                </div>
            </div>
        `;

        initPuzzleBoard(state);
    }

    function initPuzzleBoard(state) {
        const boardEl = document.getElementById('puzzle-board');
        if (!boardEl) return;
        boardEl.innerHTML = '';
        boardEl.className = 'board-container chess-board';

        let selectedSq = null;
        let legalMoves = [];

        function renderPuzzleBoard() {
            const currentState = state;
            boardEl.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let f = 0; f < 8; f++) {
                    const sq = document.createElement('div');
                    sq.className = 'square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
                    sq.style.gridRow = r + 1;
                    sq.style.gridColumn = f + 1;

                    if (selectedSq && selectedSq[0] === r && selectedSq[1] === f) sq.classList.add('selected');

                    const isLegal = legalMoves.some(m => m.to[0] === r && m.to[1] === f);
                    if (isLegal) {
                        const dot = document.createElement('div');
                        dot.className = currentState.board[r][f] ? 'capture-ring' : 'move-dot';
                        sq.appendChild(dot);
                    }

                    const piece = currentState.board[r][f];
                    if (piece) {
                        const img = document.createElement('img');
                        img.src = getPieceUrl(piece);
                        img.className = 'piece-img';
                        img.draggable = false;
                        sq.appendChild(img);
                    }

                    sq.addEventListener('click', () => {
                        if (selectedSq) {
                            const result = Puzzles.tryPuzzleMove(selectedSq, [r, f]);
                            if (result.correct) {
                                SoundEngine.move();
                                if (result.complete) {
                                    showPuzzleFeedback(true, result.xp);
                                } else {
                                    state = result.state;
                                }
                            } else {
                                SoundEngine.invalid();
                                showPuzzleFeedback(false);
                            }
                            selectedSq = null;
                            legalMoves = [];
                        } else {
                            const piece = currentState.board[r][f];
                            if (piece && piece.color === currentState.turn) {
                                selectedSq = [r, f];
                                legalMoves = ChessEngine.generateLegalMoves(currentState, currentState.turn)
                                    .filter(m => m.from[0] === r && m.from[1] === f);
                            }
                        }
                        renderPuzzleBoard();
                    });

                    boardEl.appendChild(sq);
                }
            }
        }

        renderPuzzleBoard();
    }

    function showPuzzleFeedback(correct, xp) {
        const el = document.getElementById('puzzle-feedback');
        if (!el) return;
        if (correct) {
            el.innerHTML = `<span class="feedback-correct">✓ Correct! +${xp} XP</span>`;
            setTimeout(() => {
                const nextIndex = (Puzzles.getCurrentPuzzle() + 1) % Puzzles.PUZZLE_BANK.length;
                startPuzzle(nextIndex);
            }, 1500);
        } else {
            el.innerHTML = `<span class="feedback-wrong">✗ Try again</span>`;
            setTimeout(() => { el.innerHTML = ''; }, 1500);
        }
    }

    function puzzleHint() {
        const hint = Puzzles.getHint();
        if (!hint) return;
        const boardEl = document.getElementById('puzzle-board');
        if (!boardEl) return;
        const squares = boardEl.querySelectorAll('.square');
        squares.forEach(sq => {
            const r = parseInt(sq.style.gridRow) - 1;
            const f = parseInt(sq.style.gridColumn) - 1;
            if (r === hint[0] && f === hint[1]) {
                sq.classList.add('hint-highlight');
                setTimeout(() => sq.classList.remove('hint-highlight'), 2000);
            }
        });
    }

    function renderEditor(app) {
        const state = Editor.init();
        app.innerHTML = `
            <div class="screen editor-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Board Editor</h2>
                <div class="editor-layout">
                    <div class="piece-palette" id="piece-palette"></div>
                    <div id="editor-board" class="board-container"></div>
                    <div class="editor-controls">
                        <div class="fen-section">
                            <label>FEN</label>
                            <input type="text" id="fen-input" class="text-input" value="${ChessEngine.toFEN(state)}">
                            <button onclick="App.loadEditorFEN()">Load FEN</button>
                        </div>
                        <div class="editor-options">
                            <label>Side to move</label>
                            <select id="side-to-move" onchange="Editor.setSideToMove(this.value==='white'?0:1);App.updateEditorFEN()">
                                <option value="white">White</option>
                                <option value="black">Black</option>
                            </select>
                            <label>Castling Rights</label>
                            <div class="castling-checks">
                                <label><input type="checkbox" id="castle-K" checked onchange="App.updateCastling()"> K</label>
                                <label><input type="checkbox" id="castle-Q" checked onchange="App.updateCastling()"> Q</label>
                                <label><input type="checkbox" id="castle-k" checked onchange="App.updateCastling()"> k</label>
                                <label><input type="checkbox" id="castle-q" checked onchange="App.updateCastling()"> q</label>
                            </div>
                        </div>
                        <div class="editor-buttons">
                            <button onclick="App.clearEditor()">Clear Board</button>
                            <button onclick="App.resetEditor()">Reset</button>
                            <button onclick="App.playFromEditor()">Play from here</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderPiecePalette();
        renderEditorBoard();
    }

    function renderPiecePalette() {
        const palette = document.getElementById('piece-palette');
        if (!palette) return;
        const pieces = [
            { type: 6, color: 0 }, { type: 5, color: 0 }, { type: 4, color: 0 },
            { type: 3, color: 0 }, { type: 2, color: 0 }, { type: 1, color: 0 },
            { type: 6, color: 1 }, { type: 5, color: 1 }, { type: 4, color: 1 },
            { type: 3, color: 1 }, { type: 2, color: 1 }, { type: 1, color: 1 }
        ];
        palette.innerHTML = pieces.map(p => `
            <button class="palette-piece" onclick="Editor.setSelectedPiece({type:${p.type},color:${p.color}});document.querySelectorAll('.palette-piece').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
                <img src="${getPieceUrl(p)}" draggable="false">
            </button>
        `).join('') + '<button class="palette-piece eraser" onclick="Editor.setSelectedPiece(null);document.querySelectorAll(\'.palette-piece\').forEach(b=>b.classList.remove(\'active\'));this.classList.add(\'active\')">✕</button>';
    }

    function renderEditorBoard() {
        const boardEl = document.getElementById('editor-board');
        if (!boardEl) return;
        const state = Editor.getState();
        boardEl.innerHTML = '';
        boardEl.className = 'board-container chess-board';

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.className = 'square ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
                sq.style.gridRow = r + 1;
                sq.style.gridColumn = f + 1;

                const piece = state.board[r][f];
                if (piece) {
                    const img = document.createElement('img');
                    img.src = getPieceUrl(piece);
                    img.className = 'piece-img';
                    img.draggable = false;
                    sq.appendChild(img);
                }

                sq.addEventListener('click', () => {
                    const selected = Editor.getSelectedPiece();
                    if (selected === null) {
                        Editor.removePiece(r, f);
                    } else if (selected) {
                        Editor.setPiece(r, f, { ...selected });
                    }
                    renderEditorBoard();
                    updateEditorFEN();
                });

                boardEl.appendChild(sq);
            }
        }
    }

    function updateEditorFEN() {
        const input = document.getElementById('fen-input');
        if (input) input.value = Editor.getFEN();
    }

    function loadEditorFEN() {
        const input = document.getElementById('fen-input');
        if (!input) return;
        const result = Editor.loadFEN(input.value);
        if (result) renderEditorBoard();
        else alert('Invalid FEN string');
    }

    function updateCastling() {
        Editor.setCastlingRights({
            K: document.getElementById('castle-K')?.checked || false,
            Q: document.getElementById('castle-Q')?.checked || false,
            k: document.getElementById('castle-k')?.checked || false,
            q: document.getElementById('castle-q')?.checked || false
        });
        updateEditorFEN();
    }

    function clearEditor() {
        Editor.clear();
        renderEditorBoard();
        updateEditorFEN();
    }

    function resetEditor() {
        Editor.reset();
        renderEditorBoard();
        updateEditorFEN();
    }

    function playFromEditor() {
        const fen = Editor.getFEN();
        Game.init({ mode: 'ai', aiLevel: 3, playerColor: ChessEngine.COLOR_WHITE, fen });
        Game.setOnStateChange((state) => { Board.render(state); updateGameInfo(state); });
        Game.setOnGameEnd((result, record) => { setTimeout(() => renderGameEnd(document.getElementById('app'), result, record), 500); });
        renderScreen('game');
    }

    function renderSettings(app) {
        const soundOn = SoundEngine.isEnabled();
        const vol = SoundEngine.getVolume();
        const animOn = Animations.isEnabled();
        const themeOptions = Board.getAvailableThemes().map(t => 
            `<option value="${t}" ${Board.theme===t?'selected':''}>${t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>`
        ).join('');

        app.innerHTML = `
            <div class="screen settings-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Settings</h2>
                <div class="settings-list">
                    <div class="setting-row">
                        <label>Sound</label>
                        <input type="checkbox" ${soundOn ? 'checked' : ''} onchange="SoundEngine.setEnabled(this.checked);localStorage.setItem('regicide_sound',this.checked)">
                    </div>
                    <div class="setting-row">
                        <label>Volume</label>
                        <input type="range" min="0" max="1" step="0.1" value="${vol}" onchange="SoundEngine.setVolume(parseFloat(this.value));localStorage.setItem('regicide_volume',this.value)">
                    </div>
                    <div class="setting-row">
                        <label>Animations</label>
                        <input type="checkbox" ${animOn ? 'checked' : ''} onchange="Animations.setEnabled(this.checked);localStorage.setItem('regicide_animations',this.checked)">
                    </div>
                    <div class="setting-row">
                        <label>Piece Set</label>
                        <select onchange="Board.setPieceSet(this.value)">
                            <option value="cburnett" ${Board.pieceSet==='cburnett'?'selected':''}>Cburnett</option>
                            <option value="alpha" ${Board.pieceSet==='alpha'?'selected':''}>Alpha</option>
                            <option value="merida" ${Board.pieceSet==='merida'?'selected':''}>Merida</option>
                        </select>
                    </div>
                    <div class="setting-row">
                        <label>Board Theme</label>
                        <select onchange="Board.setTheme(this.value)">
                            ${themeOptions}
                        </select>
                    </div>
                    <div class="setting-row">
                        <button class="danger-btn" onclick="if(confirm('Reset all progress?')){Profile.reset();alert('Profile reset.')}">Reset Profile</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderProfile(app) {
        const profile = Profile.load();
        const progress = Profile.getXPProgress(profile);

        app.innerHTML = `
            <div class="screen profile-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Profile</h2>
                <div class="profile-content">
                    <div class="profile-avatar large">${profile.username[0].toUpperCase()}</div>
                    <input type="text" class="text-input username-input" value="${profile.username}"
                        onchange="const p=Profile.load();p.username=this.value;Profile.save(p);App.updateProfileWidget()">
                    <div class="profile-level">
                        <span>Level ${profile.level}</span>
                        <div class="xp-bar"><div class="xp-fill" style="width:${progress.percent}%"></div></div>
                        <span class="xp-text">${progress.progress} / ${progress.needed} XP</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat"><span class="stat-val">${profile.gamesPlayed}</span><span class="stat-label">Games</span></div>
                        <div class="stat"><span class="stat-val">${profile.wins}</span><span class="stat-label">Wins</span></div>
                        <div class="stat"><span class="stat-val">${profile.losses}</span><span class="stat-label">Losses</span></div>
                        <div class="stat"><span class="stat-val">${profile.draws}</span><span class="stat-label">Draws</span></div>
                    </div>
                    <h3>Achievements</h3>
                    <div class="achievements-list">
                        ${Profile.ACHIEVEMENTS.map(a => `
                            <div class="achievement ${profile.achievements.includes(a.id) ? 'unlocked' : 'locked'}">
                                <span class="ach-icon">${a.icon}</span>
                                <div class="ach-info">
                                    <span class="ach-name">${a.name}</span>
                                    <span class="ach-desc">${a.desc}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderOnlineSetup(app) {
        app.innerHTML = `
            <div class="screen online-screen">
                <button class="back-btn" onclick="App.renderScreen('home')">← Back</button>
                <h2>Play Online</h2>
                <div class="online-content">
                    <div class="online-section">
                        <button class="big-btn" onclick="App.createOnlineRoom()">Create Room</button>
                        <div id="room-code-display" class="room-code" style="display:none"></div>
                    </div>
                    <div class="online-divider">OR</div>
                    <div class="online-section">
                        <input type="text" id="join-code-input" class="text-input" placeholder="Enter room code" maxlength="6">
                        <button class="big-btn" onclick="App.joinOnlineRoom()">Join Room</button>
                    </div>
                    <div id="online-status" class="online-status"></div>
                </div>
            </div>
        `;
    }

    async function createOnlineRoom() {
        const statusEl = document.getElementById('online-status');
        statusEl.textContent = 'Creating room...';
        try {
            const code = await MultiplayerOnline.createRoom();
            const display = document.getElementById('room-code-display');
            display.style.display = 'block';
            display.innerHTML = `<span>Room Code:</span><strong>${code}</strong>`;
            statusEl.textContent = 'Waiting for opponent...';

            MultiplayerOnline.setOnConnected(() => {
                statusEl.textContent = 'Connected! Starting game...';
                setTimeout(() => startOnlineGame(), 1000);
            });
        } catch (e) {
            statusEl.textContent = 'Error: ' + e.message;
        }
    }

    async function joinOnlineRoom() {
        const code = document.getElementById('join-code-input')?.value;
        if (!code) return;
        const statusEl = document.getElementById('online-status');
        statusEl.textContent = 'Joining room...';
        try {
            await MultiplayerOnline.joinRoom(code);
            statusEl.textContent = 'Connected! Starting game...';
            setTimeout(() => startOnlineGame(), 1000);
        } catch (e) {
            statusEl.textContent = 'Error: ' + e.message;
        }
    }

    function startOnlineGame() {
        const playerColor = MultiplayerOnline.getPlayerColor();
        Game.init({ mode: 'online', playerColor });

        Game.setOnStateChange((state) => {
            if (currentScreen === 'game') {
                Board.render(state);
                updateGameInfo(state);
            }
        });

        MultiplayerOnline.setOnMoveReceived((move) => {
            Game.executeMove(move);
        });

        MultiplayerOnline.setOnDisconnected(() => {
            alert('Opponent disconnected.');
            renderScreen('home');
        });

        Game.setOnGameEnd((result, record) => {
            setTimeout(() => renderGameEnd(document.getElementById('app'), result, record), 500);
        });

        renderScreen('game');
        if (playerColor === ChessEngine.COLOR_BLACK) Board.setFlipped(true);
    }

    return {
        init, renderScreen, showSetup, startGame, updateProfileWidget,
        renderAnalysisBoard, exportPGN, startPuzzle, puzzleHint,
        loadEditorFEN, updateCastling, clearEditor, resetEditor, playFromEditor,
        createOnlineRoom, joinOnlineRoom
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
