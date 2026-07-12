import sqlite3

conn = sqlite3.connect("transitops.db")
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [
    row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")
]

print("=== TransitOps SQLite Database Summary ===")
for table in tables:
    print(f"\nTable: {table}")
    cursor.execute(f"PRAGMA table_info({table});")
    cols = [col[1] for col in cursor.fetchall()]
    print(" | ".join(cols))
    print("-" * (len(" | ".join(cols)) + 4))

    cursor.execute(f"SELECT * FROM {table} LIMIT 5;")
    rows = cursor.fetchall()
    for row in rows:
        print(" | ".join(str(val) for val in row))

conn.close()
