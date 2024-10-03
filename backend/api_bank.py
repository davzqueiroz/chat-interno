import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO
from functions import *

# try:
#    pass
# except jwt.ExpiredSignatureError:
#    pass
# print(jwt.decode(jwt=teste['Authorization'][7:], key='webchat', algorithms='HS256'))
# return 'token'


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
CORS(app)

# ================================================= ROTA DE LOGIN ======================================================
# ================================================= ROTA DE LOGIN ======================================================
# ================================================= ROTA DE LOGIN ======================================================


@app.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    email, senha = data['email'], data['senha']
    print(email, senha)
    if type(email) is not str: return jsonify({'error': 'Email precisa ser STRING'}), 401
    if type(senha) is not str: return jsonify({'error': 'Senha precisa ser STRING'}), 401

    with connection() as conn:
        cursor = conn.cursor()
        consulta_usuario = cursor.execute(f"SELECT * FROM USUARIOS WHERE EMAIL = '{email}'").fetchone()
        print(consulta_usuario)
        if consulta_usuario is None:
            return jsonify({'error': 'Usuário e/ou senha incorreta'}), 401
        else:
            if bcrypt.checkpw(senha.encode(), consulta_usuario[2]):
                expiration = datetime.now() + timedelta(hours=8)
                token = jwt.encode(payload={'id': consulta_usuario[0], 'nome': consulta_usuario[3], 'exp': expiration}, key='webchat', algorithm='HS256')
                print(token)
                return jsonify({'token': token}), 200
            else:
                return jsonify({'error': 'Usuário e/ou senha incorreta'}), 401


# ============================================== ROTA DE MENSAGENS =====================================================
# ============================================== ROTA DE MENSAGENS =====================================================
# ============================================== ROTA DE MENSAGENS =====================================================


@app.route("/get_messages", methods=['POST'])
def get_messages():
    my_id = request.get_json()['my_id']
    is_group = request.get_json()['is_group']
    id_target = request.get_json()['id_target']
    group_name = request.get_json()['group_name']
    return consultar_mensagens(my_id, is_group, id_target, group_name)


# ============================================== ROTA DE CONTATOS ======================================================
# ============================================== ROTA DE CONTATOS ======================================================
# ============================================== ROTA DE CONTATOS ======================================================


@app.route("/get_contacts", methods=['GET'])
def get_contacts():
    with connection() as conn:
        cursor = conn.cursor()
        contacts = cursor.execute("SELECT USER_ID, NOME FROM USUARIOS").fetchall()
        contacts_list = []
        for contact in contacts:
            contacts_list.append({'id': contact[0], 'nome': contact[1]})
    return contacts_list


# app.run(port=5000, host='192.168.100.16', debug=True)
if __name__ == '__main__':
    socketio.run(app, allow_unsafe_werkzeug=True)
