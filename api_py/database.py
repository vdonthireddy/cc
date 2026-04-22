import os
import mysql.connector.pooling
from dotenv import load_dotenv
import json
import re

load_dotenv()

db_url = os.getenv("DATABASE_URL", "mysql://root:pathfinder@db:3306/pathfinder")
print(f"[DB] Using connection URL: {db_url}")

# Parse DATABASE_URL: mysql://root:pathfinder@db:3306/pathfinder
try:
    match = re.match(r"mysql://(.*?):(.*?)@(.*?):(.*?)/(.*)", db_url)
    if match:
        user, password, host, port, db_name = match.groups()
    else:
        # Try without port
        match = re.match(r"mysql://(.*?):(.*?)@(.*?)/(.*)", db_url)
        user, password, host, db_name = match.groups()
        port = 3306
except Exception as e:
    print(f"[DB] Error parsing DATABASE_URL: {e}. Falling back to defaults.")
    user, password, host, port, db_name = "root", "pathfinder", "db", 3306, "pathfinder"

db_config = {
    "database": db_name,
    "user": user,
    "password": password,
    "host": host,
    "port": int(port),
}

# Increase pool size slightly for thread safety with sync routes
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="pathfinder_pool",
    pool_size=20,
    **db_config
)

def get_db_connection():
    return pool.get_connection()

def execute_query(query, params=None, fetch_one=False):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
            return result
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"[DB] Query Error: {e}")
        return None if fetch_one else []

def execute_commit(query, params=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"[DB] Commit Error: {e}")
        return None

# Helper to handle JSON fields
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (dict, list)):
            return json.dumps(obj)
        return super().default(obj)
