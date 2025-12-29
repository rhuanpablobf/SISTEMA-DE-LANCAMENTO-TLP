from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def inspect_db():
    output = []
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            output.append("Connected.")
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='tlp' AND table_name='tlp_parametros'"))
            rows = result.fetchall()
            output.append(f"Found {len(rows)} columns:")
            for row in rows:
                output.append(f" - {row[0]}: {row[1]}")
    except Exception as e:
        output.append(f"Error: {e}")
    
    with open("db_inspection.txt", "w") as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    inspect_db()
