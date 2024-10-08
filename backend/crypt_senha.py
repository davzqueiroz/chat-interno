import sqlite3
import bcrypt


def connection():
    # connectionString = f'DRIVER={{ODBC Driver 13 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'
    # conn = pyodbc.connect(connectionString)
    # conn.autocommit = True
    conn = sqlite3.connect('bank_webchat')
    return conn


with connection() as conn:
    cursor = conn.cursor()
    senha = b'1234'
    hashed = bcrypt.hashpw(senha, bcrypt.gensalt())
    cursor.execute("INSERT INTO USUARIOS (EMAIL, SENHA, NOME) VALUES (?, ?, ?)", ('caixa@parcol.com.br', hashed, 'Renata Valente'))
    conn.commit()
