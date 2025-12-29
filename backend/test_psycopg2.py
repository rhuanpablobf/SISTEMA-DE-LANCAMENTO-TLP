import psycopg2
import os
import sys

# Mudar o diretório de trabalho para um lugar seguro sem caracteres especiais
try:
    os.chdir("C:\\Users\\Rhuan")
    print("Changed CWD to safe path")
except Exception as e:
    print(f"Could not scan working dir: {e}")

DATABASE_URL = "postgresql://postgres.kfrqtfawoybfjqjpuqir:15Rhu%40np@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

def test_conn():
    try:
        print("Connecting...")
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected!")
        cur = conn.cursor()
        cur.execute("SELECT 1")
        print("Query success:", cur.fetchone())
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_conn()
