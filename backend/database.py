import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("returns.db")

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS returns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                order_id TEXT NOT NULL,
                customer_name TEXT,
                return_date TEXT NOT NULL,
                reason TEXT NOT NULL,
                condition TEXT NOT NULL,
                comments TEXT,
                status TEXT NOT NULL DEFAULT 'Pending'
            )
        """)
        connection.commit()
