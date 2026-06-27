class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.moves = [];
        this.winningLine = null;
    }

    reset() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.moves = [];
        this.winningLine = null;
    }

    makeMove(index) {
        if (this.gameOver || this.board[index] !== '') return false;

        this.board[index] = this.currentPlayer;
        this.moves.push({ index, player: this.currentPlayer });

        const result = this._checkResult();
        if (result) {
            this.gameOver = true;
            return { valid: true, result };
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        return { valid: true, result: null };
    }

    _checkResult() {
        for (const line of WIN_LINES) {
            const [a, b, c] = line;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winningLine = line;
                return { winner: this.board[a], line };
            }
        }
        if (this.board.every(cell => cell !== '')) {
            return { winner: null, draw: true };
        }
        return null;
    }

    getMovesString() {
        return this.moves.map(m => `${m.player}:${m.index}`).join(',');
    }

    getBoardString() {
        return this.board.join('');
    }
}
