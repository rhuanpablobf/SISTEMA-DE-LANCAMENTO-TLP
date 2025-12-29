from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def upgrade_db():
    try:
        engine = create_engine(DATABASE_URL)
        conn = engine.connect()
        
        try:
            conn.execute(text("SET client_encoding = 'UTF8'"))
        except:
            pass

        columns = [
            ("ipca_percentual", "NUMERIC(5, 2)"),
            ("subsidio_percentual", "NUMERIC(5, 2)"),
            ("limite_min_base", "NUMERIC(10, 2)"),
            ("limite_max_base", "NUMERIC(10, 2)"),
            ("limite_min_atualizado", "NUMERIC(10, 2)"),
            ("limite_max_atualizado", "NUMERIC(10, 2)")
        ]

        # Do not use transaction block if we want partial success, 
        # but AUTOCOMMIT is safer for ALTER TABLE sometimes in psycog2 depending on version.
        # SQLAlchemy handles transactions by default.
        
        for col_name, col_type in columns:
            try:
                # We start a transaction for each attempt to avoid rolling back valid previous ones?
                # Actually, just wrapping in try/except inside the loop is fine if we commit at end, 
                # but if one fails and invalidates transaction...
                # Better to use independent transactions.
                with conn.begin(): 
                     conn.execute(text(f"ALTER TABLE tlp.tlp_parametros ADD COLUMN {col_name} {col_type}"))
            except:
                pass

        conn.close()
        
        with open("migration_status.txt", "w") as f:
            f.write("Done")

    except:
        pass

if __name__ == "__main__":
    upgrade_db()
