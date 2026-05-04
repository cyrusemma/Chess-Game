const Editor = (() => {
    let state = null;
    let selectedPiece = null;
    let sideToMove = ChessEngine.COLOR_WHITE;
    let castlingRights = { K: true, Q: true, k: true, q: true };

    function init() {
        state = ChessEngine.parseFEN(ChessEngine.INITIAL_FEN);
        sideToMove = ChessEngine.COLOR_WHITE;
        castlingRights = { K: true, Q: true, k: true, q: true };
        return state;
    }

    function clear() {
        state = ChessEngine.createState();
        return state;
    }

    function reset() {
        return init();
    }

    function setPiece(rank, file, piece) {
        state.board[rank][file] = piece;
        updateFEN();
    }

    function removePiece(rank, file) {
        state.board[rank][file] = null;
        updateFEN();
    }

    function loadFEN(fen) {
        try {
            state = ChessEngine.parseFEN(fen);
            sideToMove = state.turn;
            castlingRights = { ...state.castling };
            return state;
        } catch (e) {
            return null;
        }
    }

    function getFEN() {
        state.turn = sideToMove;
        state.castling = { ...castlingRights };
        return ChessEngine.toFEN(state);
    }

    function updateFEN() {
        state.turn = sideToMove;
        state.castling = { ...castlingRights };
    }

    function setSideToMove(color) {
        sideToMove = color;
        state.turn = color;
    }

    function setCastlingRights(rights) {
        castlingRights = { ...rights };
        state.castling = { ...rights };
    }

    function getState() { return state; }
    function setSelectedPiece(p) { selectedPiece = p; }
    function getSelectedPiece() { return selectedPiece; }

    return { init, clear, reset, setPiece, removePiece, loadFEN, getFEN, setSideToMove, setCastlingRights, getState, setSelectedPiece, getSelectedPiece };
})();
