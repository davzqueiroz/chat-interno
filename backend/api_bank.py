import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from functions import *
from hash_map import Hash_map

client_connections = Hash_map()

import socketio
import eventlet

# try:
#    pass
# except jwt.ExpiredSignatureError:
#    pass
# print(jwt.decode(jwt=teste['Authorization'][7:], key='webchat', algorithms='HS256'))
# return 'token'

# =================================================== SOCKET.IO ========================================================
# =================================================== SOCKET.IO ========================================================
# =================================================== SOCKET.IO ========================================================

# create a Socket.IO server
sio = socketio.Server(cors_allowed_origins='*')
# client_connections = []  # Dicionário para mapear identificação de conexão (request.sid) aos nomes dos clientes



@sio.event
def connect(sid, environ):
    print(f"Conectado: ${sid}")
    try:
        headers = environ["headers_raw"]
        token = ""
        for tupla in headers:
            if 'Authorization' in tupla:
                token = tupla[1]

        user_data = jwt.decode(token,"webchat",algorithms=["HS256"])
        user_data['sid'] = sid
        client_connections.set(user_data["id"],user_data)

        # Salvar o SID e o cliente no hash_map ou numa lista
        # user_data['sid'] = sid
        # clients_connection.set(user_data['id'], user_data)
        # client_connection.append(user_data)
    except jwt.exceptions.InvalidSignatureError:
        sio.disconnect(sid)
    except jwt.exceptions.ExpiredSignatureError:
        sio.disconnect(sid)
    except jwt.exceptions.InvalidTokenError:
        sio.disconnect(sid)
    except jwt.exceptions.DecodeError:
        sio.disconnect(sid)


@sio.event
def disconnect(sid):
    print('Desconectado: ', sid)
    # Remover usuarios desconectados da array
    #sio.emit('connected_users', client_connections)




@sio.on('send_message')
def send_message(sid, data):
    time = datetime.now()
    target_id = data['target_id']  # Nome do destinatário
    message = data['message']
    author = sid

    if client_connections.has(target_id):
        target_sid = client_connections.get(target_id)["sid"]
        message_obj = {""}
        sio.emit("message", data, target_sid)




# ===================================================== FLASK ==========================================================
# ===================================================== FLASK ==========================================================
# ===================================================== FLASK ==========================================================


# Criação da aplicação Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
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
                expiration = datetime.now() + timedelta(hours=9)
                token = jwt.encode(payload={'id': consulta_usuario[0], 'nome': consulta_usuario[3], 'exp': expiration},
                                   key='webchat', algorithm='HS256')
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
    app_with_socketio = socketio.WSGIApp(sio, app)
    eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 5000)), app_with_socketio)
