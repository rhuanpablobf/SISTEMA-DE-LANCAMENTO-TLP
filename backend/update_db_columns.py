from sqlalchemy import create_engine, text
import os

# Database URL (same as in database.py)
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def upgrade_db():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking/Updating tlp.tlp_parametros table...")
        
        # Helper to add column if not exists
        def add_column(column_name, data_type):
            try:
                # This query is idempotent-ish by checking active columns? 
                # Actually, simpler to just Try/Except the ALTER TABLE or check information_schema
                check_sql = text(f"SELECT column_name FROM information_schema.columns WHERE table_schema='tlp' AND table_name='tlp_parametros' AND column_name='{column_name}'")
                result = conn.execute(check_sql).fetchone()
                
                if not result:
                    print(f"Adding column {column_name}...")
                    conn.execute(text(f"ALTER TABLE tlp.tlp_parametros ADD COLUMN {column_name} {data_type}"))
                    print(f"Column {column_name} added.")
                else:
                    print(f"Column {column_name} already exists.")
            except Exception as e:
                print(f"Error checking/adding column {column_name}: {e}")

        # Add columns
        add_column("ipca_percentual", "NUMERIC(5, 2)")
        add_column("subsidio_percentual", "NUMERIC(5, 2)")
        add_column("limite_min_base", "NUMERIC(10, 2)")
        add_column("limite_max_base", "NUMERIC(10, 2)")
        add_column("limite_min_atualizado", "NUMERIC(10, 2)")
        add_column("limite_max_atualizado", "NUMERIC(10, 2)")
        
        conn.commit()
    print("Database upgrade finished.")

if __name__ == "__main__":
    upgrade_db()
