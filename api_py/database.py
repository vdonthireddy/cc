import os
import mysql.connector.pooling
from dotenv import load_dotenv
import json

load_dotenv()

db_url = os.getenv("DATABASE_URL")
# Parse DATABASE_URL: mysql://root:pathfinder@db:3306/pathfinder
# Assuming standard format for now
import re
match = re.match(r"mysql://(.*?):(.*?)@(.*?):(.*?)/(.*)", db_url)
user, password, host, port, db_name = match.groups()

db_config = {
    "database": db_name,
    "user": user,
    "password": password,
    "host": host,
    "port": int(port),
}

pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="pathfinder_pool",
    pool_size=10,
    **db_config
)

def get_db_connection():
    return pool.get_connection()

def execute_query(query, params=None, fetch_one=False):
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

def execute_commit(query, params=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params or ())
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

# Helper to handle JSON fields
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (dict, list)):
            return json.dumps(obj)
        return super().default(obj)
