from sqlalchemy import create_engine, text
import sys

# Force output to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def upgrade_db():
    print("Starting DB upgrade...")
    try:
        engine = create_engine(DATABASE_URL)
        conn = engine.connect()
        print("Connected to DB.")
        
        # Columns to check and add
        columns = [
            ("ipca_percentual", "NUMERIC(5, 2)"),
            ("subsidio_percentual", "NUMERIC(5, 2)"),
            ("limite_min_base", "NUMERIC(10, 2)"),
            ("limite_max_base", "NUMERIC(10, 2)"),
            ("limite_min_atualizado", "NUMERIC(10, 2)"),
            ("limite_max_atualizado", "NUMERIC(10, 2)")
        ]

        for col_name, col_type in columns:
            try:
                # Check column
                check_query = text(f"SELECT column_name FROM information_schema.columns WHERE table_schema='tlp' AND table_name='tlp_parametros' AND column_name='{col_name}'")
                res = conn.execute(check_query).fetchone()
                
                if not res:
                    print(f"Adding {col_name}...")
                    alter_query = text(f"ALTER TABLE tlp.tlp_parametros ADD COLUMN {col_name} {col_type}")
                    conn.execute(alter_query)
                    print(f"Added {col_name}.")
                else:
                    print(f"{col_name} exists.")
                    
            except Exception as e:
                print(f"Error on {col_name}: {e}")

        conn.commit()
        conn.close()
        print("Upgrade Complete.")
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    upgrade_db()
