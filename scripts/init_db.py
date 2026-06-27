"""Create PostgreSQL database if it does not exist, then initialize tables."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from config import get_settings
from database import engine, Base
import models  # noqa: F401 — register models with Base


def create_database():
    settings = get_settings()
    try:
        conn = psycopg2.connect(
            host=settings.database_host,
            port=settings.database_port,
            user=settings.database_user,
            password=settings.database_password,
            dbname="postgres",
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (settings.database_name,),
        )
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{settings.database_name}"')
            print(f"Database '{settings.database_name}' created successfully.")
        else:
            print(f"Database '{settings.database_name}' already exists.")
        cur.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print(f"Could not connect to PostgreSQL: {e}")
        print("\nMake sure PostgreSQL is running and .env credentials are correct.")
        return False


def init_tables():
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")


if __name__ == "__main__":
    print("Initializing Tic Tac Toe database...")
    if create_database():
        init_tables()
        print("Done!")
    else:
        sys.exit(1)
