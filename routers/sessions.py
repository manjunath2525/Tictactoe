from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import GameSession, Gameplay, GameMode, GameResult
from schemas import (
    SessionCreate,
    SessionResponse,
    SessionSummary,
    GameplayCreate,
    GameplayResponse,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _resolve_winner(session: GameSession) -> str | None:
    if session.player1_wins > session.player2_wins:
        return session.player1_name
    if session.player2_wins > session.player1_wins:
        return session.player2_name or "Player 2"
    return None


@router.post("", response_model=SessionResponse)
def create_session(data: SessionCreate, db: Session = Depends(get_db)):
    if data.mode == GameMode.COMPUTER and not data.difficulty:
        raise HTTPException(status_code=400, detail="Difficulty required for computer mode")
    if data.mode == GameMode.PLAYER and not data.player2_name:
        raise HTTPException(status_code=400, detail="Second player name required")

    session = GameSession(
        mode=data.mode,
        player1_name=data.player1_name.strip(),
        player2_name=data.player2_name.strip() if data.player2_name else None,
        difficulty=data.difficulty,
        target_games=data.target_games if data.mode == GameMode.PLAYER else 1,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)):
    return (
        db.query(GameSession)
        .order_by(GameSession.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/gameplay", response_model=GameplayResponse)
def record_gameplay(
    session_id: int, data: GameplayCreate, db: Session = Depends(get_db)
):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_complete:
        raise HTTPException(status_code=400, detail="Session already complete")

    game_number = session.games_played + 1

    gameplay = Gameplay(
        session_id=session.id,
        game_number=game_number,
        result=data.result,
        winner_name=data.winner_name,
        moves=data.moves,
        board_final=data.board_final,
    )
    db.add(gameplay)

    session.games_played = game_number

    if data.result in (GameResult.PLAYER1, GameResult.HUMAN):
        session.player1_wins += 1
    elif data.result in (GameResult.PLAYER2, GameResult.COMPUTER):
        session.player2_wins += 1
    elif data.result == GameResult.DRAW:
        session.draws += 1

    if session.mode == GameMode.PLAYER and session.games_played >= session.target_games:
        winner = _resolve_winner(session)
        if winner:
            session.is_complete = True
            session.winner_name = winner

    db.commit()
    db.refresh(gameplay)
    db.refresh(session)
    return gameplay


@router.post("/{session_id}/tiebreaker", response_model=SessionResponse)
def add_tiebreaker_game(session_id: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.player1_wins != session.player2_wins:
        raise HTTPException(status_code=400, detail="No tie to break")

    session.target_games += 1
    session.is_complete = False
    session.winner_name = None
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/complete", response_model=SessionResponse)
def complete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_complete = True
    session.winner_name = _resolve_winner(session)
    db.commit()
    db.refresh(session)
    return session
