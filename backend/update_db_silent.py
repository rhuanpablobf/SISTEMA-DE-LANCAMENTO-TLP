from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

def upgrade_db():
    try:
        engine = create_engine(DATABASE_URL)
        conn = engine.connect()
        
        columns = [
            ("ipca_percentual", "NUMERIC(5, 2)"),
            ("subsidio_percentual", "NUMERIC(5, 2)"),
            ("limite_min_base", "NUMERIC(10, 2)"),
            ("limite_max_base", "NUMERIC(10, 2)"),
            ("limite_min_atualizado", "NUMERIC(10, 2)"),
            ("limite_max_atualizado", "NUMERIC(10, 2)")
        ]

        # Use transaction
        with conn.begin():
            for col_name, col_type in columns:
                try:
                    check_query = text(f"SELECT column_name FROM information_schema.columns WHERE table_schema='tlp' AND table_name='tlp_parametros' AND column_name='{col_name}'")
                    res = conn.execute(check_query).fetchone()
                    
                    if not res:
                        alter_query = text(f"ALTER TABLE tlp.tlp_parametros ADD COLUMN {col_name} {col_type}")
                        conn.execute(alter_query)
                except:
                    pass
        conn.close()
        
        with open("migration_log.txt", "w") as f:
            f.write("Migration Success")
            
    except Exception as e:
        with open("migration_log.txt", "w") as f:
            f.write(f"Migration Failed: {str(e)}")

if __name__ == "__main__":
    upgrade_db()
