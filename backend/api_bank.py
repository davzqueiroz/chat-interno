from flask import Flask
from flask_cors import CORS, cross_origin
import pyodbc
import json

SERVER = '192.168.0.169,1433'
DATABASE = 'DaviTalk'
USERNAME = 'davi'
PASSWORD = '12345678@'


def connection():
    connectionString = f'DRIVER={{ODBC Driver 13 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'
    conn = pyodbc.connect(connectionString)
    conn.autocommit = True
    return conn


app = Flask(__name__)
CORS(app)


@app.route("/", methods=[''])
def insert_message():
    return None


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
