const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

const BotAI = {
    getMove(board, difficulty, botSymbol) {
        const humanSymbol = botSymbol === 'X' ? 'O' : 'X';
        const empty = board.map((v, i) => (v === '' ? i : null)).filter(v => v !== null);

        if (empty.length === 0) return -1;

        switch (difficulty) {
            case 'easy':
                return this._randomMove(empty);
            case 'medium':
                return this._mediumMove(board, empty, botSymbol, humanSymbol);
            case 'hard':
                return this._minimaxMove(board, botSymbol, humanSymbol);
            default:
                return this._randomMove(empty);
        }
    },

    _randomMove(empty) {
        return empty[Math.floor(Math.random() * empty.length)];
    },

    _mediumMove(board, empty, botSymbol, humanSymbol) {
        if (Math.random() < 0.7) {
            const winMove = this._findWinningMove(board, botSymbol);
            if (winMove !== -1) return winMove;

            const blockMove = this._findWinningMove(board, humanSymbol);
            if (blockMove !== -1) return blockMove;

            if (board[4] === '') return 4;

            const corners = [0, 2, 6, 8].filter(i => board[i] === '');
            if (corners.length > 0) {
                return corners[Math.floor(Math.random() * corners.length)];
            }
        }
        return this._randomMove(empty);
    },

    _minimaxMove(board, botSymbol, humanSymbol) {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = botSymbol;
                const score = this._minimax(board, 0, false, botSymbol, humanSymbol);
                board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    },

    _minimax(board, depth, isMaximizing, botSymbol, humanSymbol) {
        const winner = this._checkWinner(board);
        if (winner === botSymbol) return 10 - depth;
        if (winner === humanSymbol) return depth - 10;
        if (winner === 'draw') return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = botSymbol;
                    best = Math.max(best, this._minimax(board, depth + 1, false, botSymbol, humanSymbol));
                    board[i] = '';
                }
            }
            return best;
        }

        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = humanSymbol;
                best = Math.min(best, this._minimax(board, depth + 1, true, botSymbol, humanSymbol));
                board[i] = '';
            }
        }
        return best;
    },

    _findWinningMove(board, symbol) {
        for (const line of WIN_LINES) {
            const [a, b, c] = line;
            const cells = [board[a], board[b], board[c]];
            const symbolCount = cells.filter(v => v === symbol).length;
            const emptyCount = cells.filter(v => v === '').length;
            if (symbolCount === 2 && emptyCount === 1) {
                if (board[a] === '') return a;
                if (board[b] === '') return b;
                if (board[c] === '') return c;
            }
        }
        return -1;
    },

    _checkWinner(board) {
        for (const [a, b, c] of WIN_LINES) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (board.every(cell => cell !== '')) return 'draw';
        return null;
    },
};
