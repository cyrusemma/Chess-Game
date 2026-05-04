const MultiplayerLocal = (() => {
    let player1Name = 'White';
    let player2Name = 'Black';

    function init(options = {}) {
        player1Name = options.player1 || 'White';
        player2Name = options.player2 || 'Black';
        Game.init({ mode: 'local', playerColor: ChessEngine.COLOR_WHITE, fen: options.fen });
    }

    function getCurrentPlayerName() {
        const state = Game.getState();
        if (!state) return '';
        return state.turn === ChessEngine.COLOR_WHITE ? player1Name : player2Name;
    }

    function getPlayer1Name() { return player1Name; }
    function getPlayer2Name() { return player2Name; }

    return { init, getCurrentPlayerName, getPlayer1Name, getPlayer2Name };
})();
