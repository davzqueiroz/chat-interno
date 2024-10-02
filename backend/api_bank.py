from flask import Flask
from flask_cors import CORS, cross_origin
import pyodbc
import json
import sqlite3

SERVER = '192.168.0.169,1433'
DATABASE = 'DaviTalk'
USERNAME = 'davi'
PASSWORD = '12345678@'


def connection():
    # connectionString = f'DRIVER={{ODBC Driver 13 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'
    # conn = pyodbc.connect(connectionString)
    # conn.autocommit = True
    conn = sqlite3.connect('bank_webchat')
    return conn


with connection() as conn:
    user_1 = 'davi'
    user_2 = 'ivan'
    cursor = conn.cursor()
    mensagens = cursor.execute(f"SELECT * FROM MENSAGENS WHERE DE = '{user_1}' or DE = '{user_2}' AND PARA = '{user_1}' or PARA = '{user_2}' ORDER BY DIA_HORA ASC").fetchall()
    print(mensagens)

exit()

app = Flask(__name__)
CORS(app)


@app.route("/get_messages", methods=[''])
def get_messages():
    with connection() as conn:
        cursor = conn.cursor()
        mensagens = cursor.execute("SELECT * FROM MENSAGENS").fetchall()
        print(mensagens)

    return mensagens


@app.route("/get_contacts", methods=['GET'])
def get_contacts():
    with connection() as conn:
        cursor = conn.cursor()
        contacts = cursor.execute("SELECT NOME FROM USUARIOS").fetchall()
        contacts_list = []
        for contact in contacts:
            contacts_list.append(contact[0])
        contacts_json = {'nomes': contacts_list}
        contacts_json = json.dumps(contacts_json)
    return contacts_json


app.run(port=5000, host='localhost', debug=True)
