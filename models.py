import enum
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class GameMode(str, enum.Enum):
    COMPUTER = "computer"
    PLAYER = "player"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class GameResult(str, enum.Enum):
    PLAYER1 = "player1"
    PLAYER2 = "player2"
    DRAW = "draw"
    COMPUTER = "computer"
    HUMAN = "human"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mode: Mapped[GameMode] = mapped_column(Enum(GameMode), nullable=False)
    player1_name: Mapped[str] = mapped_column(String(100), nullable=False)
    player2_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    difficulty: Mapped[Difficulty | None] = mapped_column(Enum(Difficulty), nullable=True)
    target_games: Mapped[int] = mapped_column(Integer, default=1)
    player1_wins: Mapped[int] = mapped_column(Integer, default=0)
    player2_wins: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    is_complete: Mapped[bool] = mapped_column(default=False)
    winner_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    gameplays: Mapped[list["Gameplay"]] = relationship(
        "Gameplay", back_populates="session", cascade="all, delete-orphan"
    )


class Gameplay(Base):
    __tablename__ = "gameplays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False
    )
    game_number: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[GameResult] = mapped_column(Enum(GameResult), nullable=False)
    winner_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    moves: Mapped[str | None] = mapped_column(Text, nullable=True)
    board_final: Mapped[str | None] = mapped_column(String(9), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["GameSession"] = relationship("GameSession", back_populates="gameplays")
