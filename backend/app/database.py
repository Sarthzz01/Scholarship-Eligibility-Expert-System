import sqlite3
from sqlalchemy import create_engine, inspect, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./scholarships.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def auto_migrate():
    """
    Safely inspects existing SQLite tables and adds any missing columns.
    Preserves all existing scholarship and evaluation records without data loss.
    """
    with engine.connect() as conn:
        inspector = inspect(conn)
        existing_tables = inspector.get_table_names()
        
        # Check scholarships table
        if "scholarships" in existing_tables:
            columns = [col["name"] for col in inspector.get_columns("scholarships")]
            new_columns = [
                ("deadline", "VARCHAR(40) DEFAULT '2026-11-30'"),
                ("award_amount", "INTEGER DEFAULT 50000"),
                ("category", "VARCHAR(50) DEFAULT 'All'"),
                ("course_level", "VARCHAR(50) DEFAULT 'Post-Matric'"),
                ("required_documents_json", "TEXT DEFAULT '[\"Income Certificate\", \"Caste Certificate\", \"Domicile Certificate\", \"Mark Sheet\"]'"),
                ("application_effort_hours", "FLOAT DEFAULT 4.0"),
                ("academic_year", "VARCHAR(30) DEFAULT '2026-2027'"),
                ("is_archived", "BOOLEAN DEFAULT 0"),
                ("version", "INTEGER DEFAULT 1"),
            ]
            for col_name, col_def in new_columns:
                if col_name not in columns:
                    conn.execute(text(f"ALTER TABLE scholarships ADD COLUMN {col_name} {col_def}"))
                    conn.commit()

        # Check evaluations table
        if "evaluations" in existing_tables:
            columns = [col["name"] for col in inspector.get_columns("evaluations")]
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN user_id INTEGER DEFAULT NULL"))
                conn.commit()
            if "rule_version" not in columns:
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN rule_version INTEGER DEFAULT 1"))
                conn.commit()

        # Check application_plans table
        if "application_plans" in existing_tables:
            columns = [col["name"] for col in inspector.get_columns("application_plans")]
            new_plan_cols = [
                ("notes", "TEXT DEFAULT ''"),
                ("applied_date", "VARCHAR(40) DEFAULT ''"),
            ]
            for col_name, col_def in new_plan_cols:
                if col_name not in columns:
                    conn.execute(text(f"ALTER TABLE application_plans ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
