# Tic Tac Toe Arena

A full-stack Tic Tac Toe web app with a vibrant UI, bot AI, two-player championship mode, and PostgreSQL session tracking.

## Features

- **vs Computer** — Play against a bot with three difficulty levels:
  - **Easy** — random moves
  - **Medium** — blocks wins and takes opportunities ~70% of the time
  - **Hard** — unbeatable minimax AI
- **vs Player** — Local two-player championship mode with a configurable target (best of 3, 5, 10, 15, or custom)
- **Tiebreaker** — if both players finish with equal wins, an extra game is offered to decide the champion
- **Session persistence** — every game session and individual round is saved to PostgreSQL
- **Animated UI** — Bootstrap layout, custom CSS, win-line animation, scoreboard, and progress tracking

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python, FastAPI, SQLAlchemy         |
| Database   | PostgreSQL                          |
| Frontend   | HTML, Bootstrap 5, vanilla JavaScript |
| Server     | Uvicorn                             |

## Project Structure

```
TICTACTOE/
├── main.py              # FastAPI app entry point
├── config.py            # Settings loaded from .env
├── database.py          # SQLAlchemy engine & session
├── models.py            # GameSession & Gameplay models
├── schemas.py           # Pydantic request/response schemas
├── routers/
│   └── sessions.py      # REST API routes
├── scripts/
│   └── init_db.py       # Creates DB and tables
├── templates/
│   └── index.html       # Main game page
├── static/
│   ├── css/style.css    # Theme & animations
│   └── js/
│       ├── bot.js       # Bot AI logic
│       ├── game.js      # Tic-tac-toe game engine
│       └── app.js       # UI & API integration
├── .env.example         # Environment variable template
└── requirements.txt     # Python dependencies
```

## Prerequisites

- Python 3.10+
- PostgreSQL installed and running

## Setup

### 1. Clone and create a virtual environment

```powershell
cd TICTACTOE
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure environment variables

Copy the example env file and update your PostgreSQL credentials:

```powershell
copy .env.example .env
```

Edit `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=tictactoe_db

APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=True
```

### 3. Initialize the database

This creates the `tictactoe_db` database (if it doesn't exist) and all required tables:

```powershell
python scripts/init_db.py
```

### 4. Run the server

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## API Endpoints

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/`                                   | Game UI                        |
| GET    | `/health`                             | Health check                   |
| POST   | `/api/sessions`                       | Create a new game session      |
| GET    | `/api/sessions`                       | List recent sessions           |
| GET    | `/api/sessions/{id}`                  | Get session with all gameplays |
| POST   | `/api/sessions/{id}/gameplay`         | Record a completed round       |
| POST   | `/api/sessions/{id}/tiebreaker`       | Add an extra tiebreaker game   |
| POST   | `/api/sessions/{id}/complete`         | Mark session as complete       |

Interactive API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

## How to Play

### vs Computer
1. Enter your name and pick a difficulty level.
2. Click **Start Game** — you play as **X**, the bot plays as **O**.

### vs Player
1. Enter both player names and choose a target number of games.
2. Click **Start Championship** — players alternate as X and O each round.
3. The player with the most wins after the target is reached wins the championship.
4. If tied at the end, a tiebreaker round is offered.

## License

MIT
