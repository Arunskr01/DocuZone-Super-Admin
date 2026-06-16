import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def get_db_connection():
    # Recommended driver: 'ODBC Driver 17 for SQL Server'
    # Try different drivers if this fails depending on what is installed on the system
    drivers = [x for x in pyodbc.drivers() if 'SQL Server' in x]
    driver = 'ODBC Driver 17 for SQL Server'
    if drivers and driver not in drivers:
        driver = drivers[-1] # Fallback to the latest available SQL Server driver
        
    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "TrustServerCertificate=yes;"
    )
    
    conn = pyodbc.connect(connection_string)
    return conn

def get_db_cursor():
    conn = get_db_connection()
    return conn, conn.cursor()
