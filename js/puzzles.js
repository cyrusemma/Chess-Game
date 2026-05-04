const Puzzles = (() => {
    const PUZZLE_BANK = [
        { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: [[[0,7],[2,5]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', solution: [[[7,4],[0,4]]], theme: 'Back Rank', difficulty: 1 },
        { fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 3', solution: [[[0,7],[4,3]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: '3qk3/8/8/8/8/8/8/4K2R w K - 0 1', solution: [[[7,7],[7,5]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: 'r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: [[[7,4],[7,6]]], theme: 'Castling', difficulty: 1 },
        { fen: '2r3k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1', solution: [[[7,1],[0,1]]], theme: 'Back Rank', difficulty: 1 },
        { fen: 'k7/8/1K6/8/8/8/8/1R6 w - - 0 1', solution: [[[7,1],[0,1]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: '5rk1/5ppp/8/8/8/4B3/5PPP/6K1 w - - 0 1', solution: [[[5,4],[0,0]]], theme: 'Back Rank', difficulty: 2 },
        { fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4', solution: [[[4,2],[2,4]]], theme: 'Pin', difficulty: 2 },
        { fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 6', solution: [[[7,1],[5,2]]], theme: 'Development', difficulty: 2 },
        { fen: 'r2qkb1r/ppp2ppp/2n1bn2/3pp3/4P3/1BN2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5', solution: [[[4,4],[3,3]]], theme: 'Center', difficulty: 2 },
        { fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: [[[5,5],[3,4]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2', solution: [[[6,3],[4,3]]], theme: 'Center', difficulty: 1 },
        { fen: '4k3/8/8/8/8/5n2/4R3/4K3 w - - 0 1', solution: [[[6,4],[0,4]]], theme: 'Check', difficulty: 2 },
        { fen: 'r3k2r/ppp2ppp/2n1bn2/3qp3/3P4/2N1BN2/PPP2PPP/R2QKB1R w KQkq - 0 8', solution: [[[5,2],[3,3]]], theme: 'Discovery', difficulty: 3 },
        { fen: '2kr4/ppp2ppp/2n5/3q4/8/2N5/PPP2PPP/R3KB1R w KQ - 0 12', solution: [[[5,2],[3,3]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r1b1kb1r/pppp1ppp/5n2/4p1q1/2B1n3/3P4/PPP2PPP/RNBQK1NR w KQkq - 0 5', solution: [[[6,3],[5,4]]], theme: 'Tactics', difficulty: 2 },
        { fen: '8/8/8/8/8/5k2/4q3/4K3 b - - 0 1', solution: [[[6,4],[5,4]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: 'r3r1k1/ppp2ppp/2n5/3q4/3P4/5N2/PP3PPP/R3R1K1 w - - 0 14', solution: [[[7,4],[0,4]]], theme: 'Pin', difficulty: 3 },
        { fen: 'r1bqk2r/ppp2ppp/2n2n2/3pp3/1bPP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 5', solution: [[[5,2],[3,1]]], theme: 'Attack', difficulty: 2 },
        { fen: '6k1/ppp2ppp/8/3r4/8/8/PPP2PPP/4R1K1 w - - 0 1', solution: [[[7,4],[3,4]]], theme: 'Exchange', difficulty: 2 },
        { fen: 'r2q1rk1/ppp2ppp/2n1bn2/3p4/3P1B2/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8', solution: [[[5,5],[3,4]]], theme: 'Tactics', difficulty: 3 },
        { fen: '1k6/ppp5/8/8/8/8/5PPP/4R1K1 w - - 0 1', solution: [[[7,4],[0,4]]], theme: 'Mate in 1', difficulty: 1 },
        { fen: 'r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 7', solution: [[[4,2],[3,3]]], theme: 'Center', difficulty: 2 },
        { fen: 'rnbqkb1r/pp3ppp/4pn2/2pp4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5', solution: [[[4,2],[3,4]]], theme: 'Gambit', difficulty: 2 },
        { fen: 'r3kb1r/ppp1pppp/2n2n2/3q4/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6', solution: [[[5,2],[3,3]]], theme: 'Attack', difficulty: 3 },
        { fen: '8/8/4k3/8/8/4K3/4R3/8 w - - 0 1', solution: [[[5,4],[6,4]]], theme: 'Endgame', difficulty: 3 },
        { fen: 'r2qr1k1/ppp2ppp/2nb1n2/3p4/3P1B2/2N1PN2/PPQ2PPP/R3KB1R w KQ - 0 9', solution: [[[5,5],[3,4]]], theme: 'Attack', difficulty: 3 },
        { fen: '2r3k1/pp3ppp/2n5/3N4/8/8/PPP2PPP/2KR4 w - - 0 1', solution: [[[3,3],[1,4]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r4rk1/ppp1qppp/2n5/3pN3/3P4/8/PPP2PPP/R2Q1RK1 w - - 0 11', solution: [[[3,4],[1,5]]], theme: 'Fork', difficulty: 3 },
        { fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', solution: [[[5,5],[3,4]]], theme: 'Center', difficulty: 1 },
        { fen: '3r2k1/ppp2ppp/8/4N3/8/8/PPP2PPP/3R2K1 w - - 0 1', solution: [[[3,4],[1,5]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 0 6', solution: [[[2,5],[4,4]]], theme: 'Pin', difficulty: 3 },
        { fen: '8/5pk1/6pp/8/8/6PP/5PK1/4R3 w - - 0 1', solution: [[[7,4],[0,4]]], theme: 'Endgame', difficulty: 2 },
        { fen: 'r3k2r/pppq1ppp/2n1bn2/3pp3/2PP4/2N1PN2/PP1BQPPP/R3KB1R w KQkq - 0 8', solution: [[[4,2],[3,3]]], theme: 'Center', difficulty: 3 },
        { fen: '2kr3r/ppp2ppp/2n5/3q4/3P4/2N2N2/PPP2PPP/R3K2R w KQ - 0 10', solution: [[[7,4],[7,6]]], theme: 'Castling', difficulty: 2 },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', solution: [[[7,5],[4,2]]], theme: 'Development', difficulty: 1 },
        { fen: '6k1/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1', solution: [[[3,3],[1,4]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', solution: [[[7,4],[7,6]]], theme: 'Castling', difficulty: 2 },
        { fen: '3rr1k1/ppp2ppp/8/3pN3/3P4/8/PPP2PPP/3RR1K1 w - - 0 14', solution: [[[3,4],[1,3]]], theme: 'Fork', difficulty: 3 },
        { fen: 'r1bqkbnr/1ppp1ppp/p1n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4', solution: [[[4,2],[1,5]]], theme: 'Attack', difficulty: 2 },
        { fen: '4r1k1/ppp2ppp/8/8/4n3/8/PPPR1PPP/4R1K1 w - - 0 1', solution: [[[7,4],[4,4]]], theme: 'Exchange', difficulty: 2 },
        { fen: 'r3k2r/ppp2ppp/2n1b3/3qp3/3Pn3/2N1BN2/PPP2PPP/R2QR1K1 w kq - 0 10', solution: [[[5,2],[4,4]]], theme: 'Tactics', difficulty: 3 },
        { fen: '2r3k1/5ppp/p3p3/1p6/3n4/5N2/PPP2PPP/2KR4 b - - 0 1', solution: [[[4,3],[6,2]]], theme: 'Fork', difficulty: 2 },
        { fen: 'r1bq1rk1/ppp1nppp/3p1n2/3Pp3/2P5/2N2N2/PP2PPPP/R1BQKB1R w KQ - 0 7', solution: [[[4,2],[3,2]]], theme: 'Space', difficulty: 3 },
        { fen: '8/8/8/8/4k3/8/R7/4K3 w - - 0 1', solution: [[[6,0],[4,0]]], theme: 'Endgame', difficulty: 2 },
        { fen: 'r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1BN2N2/PPPP1PPP/R1BQK2R w KQkq - 4 6', solution: [[[4,4],[3,3]]], theme: 'Center', difficulty: 2 },
        { fen: '4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1', solution: [[[6,4],[0,4]]], theme: 'Skewer', difficulty: 2 },
        { fen: 'r1b1kbnr/pppp1ppp/2n5/4p3/2B1P3/5q2/PPPP1PPP/RNBQK1NR w KQkq - 0 4', solution: [[[6,5],[5,5]]], theme: 'Defense', difficulty: 2 },
        { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5', solution: [[[3,4],[1,5]]], theme: 'Fork', difficulty: 3 }
    ];

    let currentPuzzle = 0;
    let puzzleState = null;
    let solutionStep = 0;
    let streak = 0;
    let usedHint = false;

    function getPuzzles() { return PUZZLE_BANK; }

    function getDailyPuzzle() {
        const today = new Date();
        const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % PUZZLE_BANK.length;
        return dayIndex;
    }

    function startPuzzle(index) {
        currentPuzzle = index;
        solutionStep = 0;
        usedHint = false;
        const puzzle = PUZZLE_BANK[index];
        puzzleState = ChessEngine.parseFEN(puzzle.fen);
        return puzzleState;
    }

    function tryPuzzleMove(from, to) {
        const puzzle = PUZZLE_BANK[currentPuzzle];
        const expected = puzzle.solution[solutionStep];
        if (!expected) return { correct: false };

        if (from[0] === expected[0][0] && from[1] === expected[0][1] &&
            to[0] === expected[1][0] && to[1] === expected[1][1]) {
            const legalMoves = ChessEngine.generateLegalMoves(puzzleState, puzzleState.turn);
            const move = legalMoves.find(m =>
                m.from[0] === from[0] && m.from[1] === from[1] &&
                m.to[0] === to[0] && m.to[1] === to[1]
            );
            if (move) {
                puzzleState = ChessEngine.makeMove(puzzleState, move);
                solutionStep++;
                if (solutionStep >= puzzle.solution.length) {
                    streak++;
                    const xp = Profile.recordPuzzle(!usedHint);
                    return { correct: true, complete: true, xp, streak };
                }
                return { correct: true, complete: false, state: puzzleState };
            }
        }
        streak = 0;
        return { correct: false };
    }

    function getHint() {
        usedHint = true;
        const puzzle = PUZZLE_BANK[currentPuzzle];
        const expected = puzzle.solution[solutionStep];
        return expected ? expected[0] : null;
    }

    function getStreak() { return streak; }
    function getCurrentPuzzle() { return currentPuzzle; }

    return { getPuzzles, getDailyPuzzle, startPuzzle, tryPuzzleMove, getHint, getStreak, getCurrentPuzzle, PUZZLE_BANK };
})();
