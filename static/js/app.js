const API = {
    async createSession(data) {
        const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            const detail = err.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((e) => e.msg).join(', ')
                    : 'Failed to create session';
            throw new Error(message);
        }
        return res.json();
    },

    async recordGameplay(sessionId, data) {
        const res = await fetch(`/api/sessions/${sessionId}/gameplay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to record gameplay');
        return res.json();
    },

    async addTiebreaker(sessionId) {
        const res = await fetch(`/api/sessions/${sessionId}/tiebreaker`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to add tiebreaker');
        return res.json();
    },
};

const App = {
    session: null,
    game: null,
    mode: null,
    difficulty: null,
    targetGames: 5,
    isComputerTurn: false,
    selectedTarget: 5,

    init() {
        this.game = new TicTacToeGame();
        this._bindEvents();
    },

    _bindEvents() {
        document.getElementById('start-computer-btn').addEventListener('click', () => this._startComputer());
        document.getElementById('start-player-btn').addEventListener('click', () => this._startPlayer());
        document.getElementById('back-btn').addEventListener('click', () => this._goToMenu());
        document.getElementById('next-game-btn').addEventListener('click', () => this._nextGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this._playAgain());
        document.getElementById('result-menu-btn').addEventListener('click', () => this._goToMenu());
        document.getElementById('tiebreaker-btn').addEventListener('click', () => this._playTiebreaker());
        document.getElementById('tiebreaker-menu-btn').addEventListener('click', () => this._goToMenu());

        document.querySelectorAll('.btn-target').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-target').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTarget = parseInt(btn.dataset.target);
                document.getElementById('target-custom').value = '';
            });
        });

        document.getElementById('target-custom').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (val >= 1 && val <= 100) {
                document.querySelectorAll('.btn-target').forEach(b => b.classList.remove('active'));
                this.selectedTarget = val;
            }
        });

        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', () => this._handleCellClick(parseInt(cell.dataset.index)));
        });
    },

    async _startComputer() {
        const name = document.getElementById('computer-player-name').value.trim();
        if (!name) {
            this._showError('Please enter your name');
            return this._shake(document.getElementById('computer-player-name'));
        }

        this.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        this.mode = 'computer';

        try {
            this.session = await API.createSession({
                mode: 'computer',
                player1_name: name,
                difficulty: this.difficulty,
                target_games: 1,
            });
            this._showGame(name, 'Computer', this.difficulty);
        } catch (e) {
            console.error(e);
            this._showError(e.message || 'Could not start game. Check the server connection.');
        }
    },

    async _startPlayer() {
        const p1 = document.getElementById('player1-name').value.trim();
        const p2 = document.getElementById('player2-name').value.trim();
        if (!p1) {
            this._showError('Please enter Player 1 name');
            return this._shake(document.getElementById('player1-name'));
        }
        if (!p2) {
            this._showError('Please enter Player 2 name');
            return this._shake(document.getElementById('player2-name'));
        }

        const customTarget = document.getElementById('target-custom').value;
        this.targetGames = customTarget ? parseInt(customTarget) : this.selectedTarget;
        this.mode = 'player';

        try {
            this.session = await API.createSession({
                mode: 'player',
                player1_name: p1,
                player2_name: p2,
                target_games: this.targetGames,
            });
            this._showGame(p1, p2, null);
        } catch (e) {
            console.error(e);
            this._showError(e.message || 'Could not start championship. Check the server connection.');
        }
    },

    _showGame(p1Name, p2Name, difficulty) {
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        document.getElementById('score-p1-name').textContent = p1Name;
        document.getElementById('score-p2-name').textContent = p2Name;

        const label = difficulty
            ? `vs Computer (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`
            : `Championship — Best of ${this.targetGames}`;
        document.getElementById('game-mode-label').textContent = label;

        document.getElementById('progress-container').style.display =
            this.mode === 'player' ? 'block' : 'none';

        this._resetBoard();
        this._updateScoreboard();
        this._updateProgress();
        this._updateTurnIndicator();
    },

    _goToMenu() {
        document.getElementById('result-overlay').classList.add('d-none');
        document.getElementById('tiebreaker-overlay').classList.add('d-none');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('setup-screen').classList.add('active');
        this.session = null;
        this.game.reset();
    },

    _resetBoard() {
        this.game.reset();
        this.isComputerTurn = false;
        document.getElementById('next-game-btn').classList.add('d-none');
        const winLine = document.getElementById('win-line');
        winLine.classList.remove('visible');
        winLine.style.width = '';
        winLine.style.left = '';
        winLine.style.top = '';
        winLine.style.removeProperty('--line-angle');

        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    },

    _handleCellClick(index) {
        if (this.game.gameOver) return;
        if (this.mode === 'computer' && this.game.currentPlayer === 'O') return;

        const result = this.game.makeMove(index);
        if (!result || !result.valid) return;

        this._renderCell(index);
        if (result.result) {
            this._endRound(result.result);
        } else {
            this._updateTurnIndicator();
            if (this.mode === 'computer' && this.game.currentPlayer === 'O') {
                this._computerMove();
            }
        }
    },

    _computerMove() {
        this.isComputerTurn = true;
        const randomCell = document.querySelectorAll('.cell:not(.taken)');
        if (randomCell.length > 0) {
            randomCell[Math.floor(Math.random() * randomCell.length)].classList.add('thinking');
        }

        setTimeout(() => {
            document.querySelectorAll('.cell.thinking').forEach(c => c.classList.remove('thinking'));

            const move = BotAI.getMove(
                [...this.game.board],
                this.difficulty,
                'O'
            );

            if (move === -1) return;

            const result = this.game.makeMove(move);
            this._renderCell(move);

            if (result.result) {
                this._endRound(result.result);
            } else {
                this._updateTurnIndicator();
            }
            this.isComputerTurn = false;
        }, 600 + Math.random() * 400);
    },

    _renderCell(index) {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        const player = this.game.board[index];
        cell.textContent = player;
        cell.classList.add('taken', player.toLowerCase());
    },

    _highlightWin(line) {
        line.forEach(i => {
            document.querySelector(`.cell[data-index="${i}"]`).classList.add('winning');
        });
        this._drawWinLine(line);
    },

    _drawWinLine(line) {
        const winLine = document.getElementById('win-line');
        const board = document.getElementById('game-board');
        const wrapper = board.parentElement;
        const cells = board.querySelectorAll('.cell');
        const wrapperRect = wrapper.getBoundingClientRect();

        const getCenter = (idx) => {
            const rect = cells[idx].getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - wrapperRect.left,
                y: rect.top + rect.height / 2 - wrapperRect.top,
            };
        };

        const start = getCenter(line[0]);
        const end = getCenter(line[2]);
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

        winLine.style.setProperty('--line-angle', `${angle}deg`);
        winLine.style.width = `${length}px`;
        winLine.style.left = `${start.x}px`;
        winLine.style.top = `${start.y - 2.5}px`;
        winLine.classList.add('visible');
    },

    async _endRound(result) {
        if (result.line) this._highlightWin(result.line);

        let apiResult, winnerName;
        const p1 = this.session.player1_name;
        const p2 = this.session.player2_name || 'Computer';

        if (result.draw) {
            apiResult = 'draw';
            winnerName = null;
        } else if (this.mode === 'computer') {
            if (result.winner === 'X') {
                apiResult = 'human';
                winnerName = p1;
            } else {
                apiResult = 'computer';
                winnerName = 'Computer';
            }
        } else {
            apiResult = result.winner === 'X' ? 'player1' : 'player2';
            winnerName = result.winner === 'X' ? p1 : p2;
        }

        try {
            await API.recordGameplay(this.session.id, {
                result: apiResult,
                winner_name: winnerName,
                moves: this.game.getMovesString(),
                board_final: this.game.getBoardString(),
            });

            const updated = await fetch(`/api/sessions/${this.session.id}`).then(r => r.json());
            this.session = updated;
            this._updateScoreboard();
            this._updateProgress();
        } catch (e) {
            console.error('Failed to save gameplay:', e);
        }

        setTimeout(() => this._showRoundResult(result, winnerName), 800);
    },

    _showRoundResult(result, winnerName) {
        if (this.mode === 'computer') {
            this._showComputerResult(result, winnerName);
        } else {
            this._showPlayerResult(result, winnerName);
        }
    },

    _showComputerResult(result, winnerName) {
        const overlay = document.getElementById('result-overlay');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');

        if (result.draw) {
            icon.innerHTML = '<i class="bi bi-dash-circle"></i>';
            icon.className = 'result-icon draw';
            title.textContent = "It's a Draw!";
            message.textContent = 'Great game! Want to try again?';
        } else if (result.winner === 'X') {
            icon.innerHTML = '<i class="bi bi-trophy-fill"></i>';
            icon.className = 'result-icon win';
            title.textContent = 'You Win!';
            message.textContent = `Congratulations, ${this.session.player1_name}! You beat the ${this.difficulty} bot!`;
        } else {
            icon.innerHTML = '<i class="bi bi-emoji-frown"></i>';
            icon.className = 'result-icon lose';
            title.textContent = 'Computer Wins!';
            message.textContent = 'The bot got you this time. Try again!';
        }

        overlay.classList.remove('d-none');
    },

    _showPlayerResult(result, winnerName) {
        const gamesPlayed = this.session.games_played;
        const target = this.session.target_games;
        const p1Wins = this.session.player1_wins;
        const p2Wins = this.session.player2_wins;

        if (gamesPlayed >= target && p1Wins === p2Wins) {
            document.getElementById('tiebreaker-message').textContent =
                `${this.session.player1_name} and ${this.session.player2_name} are tied at ${p1Wins} wins each! Play an extra game to crown the champion!`;
            document.getElementById('tiebreaker-overlay').classList.remove('d-none');
            return;
        }

        if (gamesPlayed >= target) {
            const champion = p1Wins > p2Wins ? this.session.player1_name : this.session.player2_name;
            const overlay = document.getElementById('result-overlay');
            document.getElementById('result-icon').innerHTML = '<i class="bi bi-trophy-fill"></i>';
            document.getElementById('result-icon').className = 'result-icon win';
            document.getElementById('result-title').textContent = `${champion} Wins the Championship!`;
            document.getElementById('result-message').textContent =
                `Final Score: ${this.session.player1_name} ${p1Wins} — ${p2Wins} ${this.session.player2_name} (${this.session.draws} draws)`;
            overlay.classList.remove('d-none');
            return;
        }

        document.getElementById('next-game-btn').classList.remove('d-none');
        const turnText = document.getElementById('turn-text');
        if (result.draw) {
            turnText.textContent = 'Draw! Click Next Game to continue.';
        } else {
            turnText.textContent = `${winnerName} wins this round! Click Next Game.`;
        }
    },

    _nextGame() {
        this._resetBoard();
        this._updateTurnIndicator();
    },

    async _playTiebreaker() {
        try {
            this.session = await API.addTiebreaker(this.session.id);
            this.targetGames = this.session.target_games;
            document.getElementById('tiebreaker-overlay').classList.add('d-none');
            document.getElementById('game-mode-label').textContent =
                `Championship — Best of ${this.targetGames} (Tiebreaker!)`;
            this._resetBoard();
            this._updateProgress();
            this._updateTurnIndicator();
        } catch (e) {
            console.error(e);
        }
    },

    _playAgain() {
        document.getElementById('result-overlay').classList.add('d-none');
        this._goToMenu();
    },

    _updateScoreboard() {
        if (!this.session) return;
        document.getElementById('score-p1').textContent = this.session.player1_wins;
        document.getElementById('score-p2').textContent = this.session.player2_wins;
        document.getElementById('score-draws').textContent = this.session.draws;
    },

    _updateProgress() {
        if (!this.session || this.mode !== 'player') return;
        const played = this.session.games_played;
        const target = this.session.target_games;
        document.getElementById('progress-text').textContent = `Game ${Math.min(played + 1, target)} of ${target}`;
        document.getElementById('progress-fill').style.width = `${(played / target) * 100}%`;
    },

    _updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const turnText = document.getElementById('turn-text');

        if (this.game.gameOver) return;

        indicator.classList.remove('x-turn', 'o-turn');

        if (this.mode === 'computer') {
            if (this.game.currentPlayer === 'X') {
                indicator.classList.add('x-turn');
                turnText.textContent = `${this.session.player1_name}'s turn (X)`;
            } else {
                indicator.classList.add('o-turn');
                turnText.textContent = 'Computer is thinking...';
            }
        } else {
            const name = this.game.currentPlayer === 'X'
                ? this.session.player1_name
                : this.session.player2_name;
            indicator.classList.add(this.game.currentPlayer === 'X' ? 'x-turn' : 'o-turn');
            turnText.textContent = `${name}'s turn (${this.game.currentPlayer})`;
        }

        document.querySelector('.player1-score').classList.toggle('active-turn', this.game.currentPlayer === 'X');
        document.querySelector('.player2-score').classList.toggle('active-turn', this.game.currentPlayer === 'O');
    },

    _shake(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.5s ease';
        el.style.borderColor = '#d63031';
        el.focus();
        setTimeout(() => { el.style.borderColor = ''; }, 1000);
    },

    _showError(message) {
        let toast = document.getElementById('error-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'error-toast';
            toast.className = 'error-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(this._errorTimer);
        this._errorTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());
