from flask import Flask, request
from flask_cors import CORS, cross_origin
import jwt
import sqlite3
from flask_socketio import SocketIO
import datetime
import bcrypt


def connection():
    # connectionString = f'DRIVER={{ODBC Driver 13 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'
    # conn = pyodbc.connect(connectionString)
    # conn.autocommit = True
    conn = sqlite3.connect('bank_webchat')
    return conn


SERVER = '192.168.0.169,1433'
DATABASE = 'DaviTalk'
USERNAME = 'davi'
PASSWORD = '12345678@'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
CORS(app)



@app.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    # verificar se login senha tipo = correto
    # criptografar senha e ver se bate com a do banco
    # criar token jwt do usuario
    # retornar o token pro frontend
    # receber o token em todas as requisições protegidas
    login, senha = data['login'], data['senha']




    #token = jwt.encode(payload={'id': 1, 'nome': 'Davi'}, key='1234')
    #try:
    #    pass
    #except jwt.ExpiredSignatureError:
    #    pass
    #print(jwt.decode(jwt=teste['Authorization'][7:], key='1234', algorithms='HS256'))
    return 'token'


@app.route("/get_messages", methods=['POST'])
def get_messages():
    my_id = request.get_json()['my_id']
    is_group = request.get_json()['is_group']
    id_target = request.get_json()['id_target']
    group_name = request.get_json()['group_name']
    return consultar_mensagens(my_id, is_group, id_target, group_name)


@app.route("/get_contacts", methods=['GET'])
def get_contacts():
    with connection() as conn:
        cursor = conn.cursor()
        contacts = cursor.execute("SELECT USER_ID, NOME FROM USUARIOS").fetchall()
        contacts_list = []
        for contact in contacts:
            contacts_list.append({'id': contact[0], 'nome': contact[1]})
    return contacts_list


def consultar_mensagens(my_id, is_group, id_target=None, group_name=None):
    if type(my_id) is not int: raise Exception('Parâmetro MY_ID precisa ser INT')
    elif type(is_group) is not bool: raise Exception('Parâmetro IS_GROUP precisa ser Bool')
    elif id_target is not None and type(id_target) is not int: raise Exception('Parâmetro ID_TARGET precisa ser INT')

    with connection() as conn:
        cursor = conn.cursor()
        # ============================= CONSULTA CONVERSAS EM QUE MY_ID PARTICIPA ================================
        conversas_participantes = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS WHERE MEMBER_ID = {my_id}").fetchall()
        conversas_participantes = ','.join(map(str, [t[0] for t in conversas_participantes]))
        if len(conversas_participantes) == 0: return []

        # =============================== SE FOR GRUPO, CONSULTA O CONVERSATION_ID PELO NOME DO GRUPO ================
        if is_group:

            group_id = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE CONVERSATION_NAME = '{group_name}' AND CONVERSATION_ID IN ({conversas_participantes})").fetchone()
            conversation_target = group_id[0] if group_id is not None else 0

        # ============ SE NAO FOR GRUPO, EXCLUI OS GRUPOS DA LISTA E CONSULTA O CONVERSATION ID DO PRIVADO =============
        elif not is_group and id_target is not None:
            consulta = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS WHERE MEMBER_ID = {my_id} AND CONVERSATION_ID IN (SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS WHERE MEMBER_ID = {id_target})").fetchall()
            consulta = ','.join(map(str, [t[0] for t in consulta]))
            id_pvs = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE IS_GROUP = 0 AND CONVERSATION_ID IN ({consulta})").fetchone()
            conversation_target = id_pvs[0] if id_pvs is not None else 0

        if conversation_target == 0: return []

        consulta_mensagens = cursor.execute(f"SELECT * FROM MESSAGES WHERE CONVERSATION_ID = {conversation_target} ORDER BY SENT_AT").fetchall()
        mensagens = []
        for mensagem in consulta_mensagens:
            mensagens.append({'id': mensagem[0], 'conversation_id': mensagem[1], 'sender_id': mensagem[2], 'content': mensagem[3], 'sent_at': mensagem[4], 'type': mensagem[5]})
        return mensagens

        # print(cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE IS_GROUP = {is_group} AND CONVERSATION_ID IN ({retorno})").fetchall())


# app.run(port=5000, host='192.168.100.16', debug=True)
if __name__ == '__main__':
    socketio.run(app, allow_unsafe_werkzeug=True)