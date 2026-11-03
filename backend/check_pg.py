import psycopg2

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='@Bahubali2',
        host='localhost',
        port=5432
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("SUCCESS: Connected to PostgreSQL server!")
    cur.execute("SELECT 1 FROM pg_database WHERE datname='keralago_db'")
    exists = cur.fetchone()
    if not exists:
        print("Creating keralago_db database...")
        cur.execute("CREATE DATABASE keralago_db")
        print("keralago_db created successfully!")
    else:
        print("keralago_db already exists!")
    conn.close()
except Exception as e:
    print("PostgreSQL connection error:", e)
