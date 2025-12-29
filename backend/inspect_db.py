from sqlalchemy import create_engine, text
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def inspect_db():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("Connected.")
            # Query info schema
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='tlp' AND table_name='tlp_parametros'"))
            rows = result.fetchall()
            print(f"Found {len(rows)} columns:")
            for row in rows:
                print(f" - {row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
