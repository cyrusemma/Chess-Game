const Analysis = (() => {
    let moves = [];
    let positions = [];
    let currentIndex = 0;
    let evaluations = [];

    function load(gameState) {
        positions = [ChessEngine.parseFEN(ChessEngine.INITIAL_FEN)];
        moves = gameState.moveHistory || [];
        evaluations = [];

        let state = ChessEngine.parseFEN(ChessEngine.INITIAL_FEN);
        for (const move of moves) {
            state = ChessEngine.makeMove(state, move, true);
            positions.push(ChessEngine.cloneState(state));
        }

        currentIndex = 0;
        evaluatePositions();
    }

    function evaluatePositions() {
        evaluations = positions.map(pos => {
            const score = AIEasy ? AIEasy.evaluate(pos) : 0;
            return score;
        });

        for (let i = 1; i < evaluations.length; i++) {
            const diff = evaluations[i] - evaluations[i - 1];
            const movingColor = (i - 1) % 2 === 0 ? 'white' : 'black';
            let quality;

            const absDiff = Math.abs(diff);
            const isGoodForMover = (movingColor === 'white' && diff > 0) || (movingColor === 'black' && diff < 0);

            if (isGoodForMover && absDiff > 200) quality = 'brilliant';
            else if (isGoodForMover && absDiff > 50) quality = 'best';
            else if (absDiff < 30) quality = 'good';
            else if (!isGoodForMover && absDiff > 200) quality = 'blunder';
            else if (!isGoodForMover && absDiff > 100) quality = 'mistake';
            else if (!isGoodForMover && absDiff > 50) quality = 'inaccuracy';
            else quality = 'good';

            if (moves[i - 1]) moves[i - 1].quality = quality;
        }
    }

    function goTo(index) {
        currentIndex = Math.max(0, Math.min(positions.length - 1, index));
        return positions[currentIndex];
    }

    function next() { return goTo(currentIndex + 1); }
    function prev() { return goTo(currentIndex - 1); }
    function first() { return goTo(0); }
    function last() { return goTo(positions.length - 1); }

    function getCurrentIndex() { return currentIndex; }
    function getMoves() { return moves; }
    function getEvaluation(index) {
        const score = evaluations[index !== undefined ? index : currentIndex] || 0;
        const clamped = Math.max(-2000, Math.min(2000, score));
        const whitePercent = ((clamped + 2000) / 4000) * 100;
        return { score, whitePercent: Math.max(5, Math.min(95, whitePercent)) };
    }

    function getPositionCount() { return positions.length; }

    return { load, goTo, next, prev, first, last, getCurrentIndex, getMoves, getEvaluation, getPositionCount };
})();
