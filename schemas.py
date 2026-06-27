from datetime import datetime
from pydantic import BaseModel, Field

from models import GameMode, Difficulty, GameResult


class SessionCreate(BaseModel):
    mode: GameMode
    player1_name: str = Field(..., min_length=1, max_length=100)
    player2_name: str | None = Field(None, min_length=1, max_length=100)
    difficulty: Difficulty | None = None
    target_games: int = Field(default=1, ge=1, le=100)


class GameplayCreate(BaseModel):
    result: GameResult
    winner_name: str | None = None
    moves: str | None = None
    board_final: str | None = None


class GameplayResponse(BaseModel):
    id: int
    session_id: int
    game_number: int
    result: GameResult
    winner_name: str | None
    moves: str | None
    board_final: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    id: int
    mode: GameMode
    player1_name: str
    player2_name: str | None
    difficulty: Difficulty | None
    target_games: int
    player1_wins: int
    player2_wins: int
    draws: int
    games_played: int
    is_complete: bool
    winner_name: str | None
    created_at: datetime
    updated_at: datetime
    gameplays: list[GameplayResponse] = []

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: int
    mode: GameMode
    player1_name: str
    player2_name: str | None
    player1_wins: int
    player2_wins: int
    draws: int
    games_played: int
    is_complete: bool
    winner_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
