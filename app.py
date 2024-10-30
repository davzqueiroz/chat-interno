import bcrypt
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from backend.functions import *
from backend.hashmap import HashMap
import socketio
import eventlet
import socket
import os

local_ip = socket.gethostbyname(socket.gethostname())
client_connections = HashMap()
diretorio = "static/uploads/"

# =================================================== SOCKET.IO ========================================================
# =================================================== SOCKET.IO ========================================================
# =================================================== SOCKET.IO ========================================================

sio = socketio.Server(cors_allowed_origins='*')


@sio.event
def connect(sid, environ):
    headers = environ["headers_raw"]
    token = ""
    for tupla in headers:
        if 'Authorization' in tupla:
            token = tupla[1]

    user_data = verify_token(token)
    user_data['sid'] = sid
    client_connections.set(user_data["id"], user_data)
    sio.emit('receive_client_connections', client_connections.get_connections_name())


@sio.event
def disconnect(sid):
    client_connections.delete(key=client_connections.get_id_by_sid(sid))
    sio.emit('receive_client_connections', client_connections.get_connections_name())


@sio.on('send_archive')
def send_archive(sid, data):
    target_id = data['target_id']
    message = data['message']
    author_id = data['author_id']
    type_archive = data['type_archive']

    if data['is_group'] is False:
        conversation_id = consulta_conversation_id(author_id, target_id)
        insert_message(conversation_id, author_id, message, data['response_to'], data['client_id'], "BYTES", type_archive)
        message_id = consulta_message_id(author_id, message, conversation_id, data['sent_at'])

        if client_connections.has(target_id):
            data = {'target_id': target_id, 'message_id': message_id, 'message': message, 'author': sid,
                    'author_id': author_id,
                    'author_name': consulta_nome(author_id), 'is_group': data['is_group'],
                    'group_name': consulta_nome(target_id),
                    'response_to': consulta_message_using_client_id(data['response_to']), 'type': "BYTES", 'type_archive': type_archive}

            sio.emit("message", data)

    elif data['is_group'] is True:
        insert_message(target_id, author_id, message, data['response_to'], data['client_id'], "BYTES", type_archive)
        message_id = consulta_message_id(author_id, message, target_id, data['sent_at'])

        data = {'target_id': target_id, 'message_id': message_id, 'message': message, 'author': sid,
                'author_id': author_id,
                'author_name': consulta_nome(author_id), 'is_group': data['is_group'],
                'group_name': consulta_nome(target_id),
                'response_to': consulta_message_using_client_id(data['response_to']), 'type': "BYTES", 'type_archive': type_archive}

        sio.emit("message", data)


@sio.on('send_message')
def send_message(sid, data):
    target_id = data['target_id']
    message = data['message']
    author_id = data['author_id']

    if data['is_group'] is False:
        conversation_id = consulta_conversation_id(author_id, target_id)
        insert_message(conversation_id, author_id, message, data['response_to'], data['client_id'], "TEXT", None)
        message_id = consulta_message_id(author_id, message, conversation_id, data['sent_at'])

        if client_connections.has(target_id):
            data = {'target_id': target_id, 'message_id': message_id, 'message': message, 'author': sid,
                    'author_id': author_id,
                    'author_name': consulta_nome(author_id), 'is_group': data['is_group'],
                    'group_name': consulta_nome(target_id),
                    'response_to': consulta_message_using_client_id(data['response_to']), 'type': "TEXT"}

            sio.emit("message", data)

    elif data['is_group'] is True:
        insert_message(target_id, author_id, message, data['response_to'], data['client_id'], "TEXT", None)
        message_id = consulta_message_id(author_id, message, target_id, data['sent_at'])

        data = {'target_id': target_id, 'message_id': message_id, 'message': message, 'author': sid,
                'author_id': author_id,
                'author_name': consulta_nome(author_id), 'is_group': data['is_group'],
                'group_name': consulta_nome(target_id),
                'response_to': consulta_message_using_client_id(data['response_to']), 'type': "TEXT"}

        sio.emit("message", data)


# ===================================================== FLASK ==========================================================
# ===================================================== FLASK ==========================================================
# ===================================================== FLASK ==========================================================

app = Flask(__name__)
app.config['SECRET_KE'] = 'secret!'
CORS(app)


@app.route('/')
def home():
    return render_template('login.html')


@app.route('/chat')
def chat():
    return render_template('chat.html')


# ================================================= ROTA DE LOGIN ======================================================
# ================================================= ROTA DE LOGIN ======================================================
# ================================================= ROTA DE LOGIN ======================================================


@app.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    email, password = data['email'], data['senha']
    if type(email) is not str: return jsonify({'error': 'Email precisa ser STRING'}), 401
    if type(password) is not str: return jsonify({'error': 'Senha precisa ser STRING'}), 401

    with connection() as conn:
        cursor = conn.cursor()
        consulta_usuario = cursor.execute(f"SELECT * FROM USUARIOS WHERE EMAIL = '{email}'").fetchone()
        if consulta_usuario is None:
            return jsonify({'error': 'Usuário e/ou senha incorreta'}), 401
        else:
            if bcrypt.checkpw(password.encode(), consulta_usuario[2]):
                expiration = datetime.now() + timedelta(hours=9)
                token = jwt.encode(
                    payload={'id': consulta_usuario[0], 'nome': consulta_usuario[3], 'nivel': consulta_usuario[4],
                             'exp': expiration},
                    key='webchat', algorithm='HS256')
                return jsonify({'token': token}), 200
            else:
                return jsonify({'error': 'Usuário e/ou senha incorreta'}), 401


# ============================================== ROTA DE MENSAGENS =====================================================
# ============================================== ROTA DE MENSAGENS =====================================================
# ============================================== ROTA DE MENSAGENS =====================================================


@app.route("/get_messages", methods=['POST'])
def get_messages():
    token = request.headers['Authorization'].replace('Bearer ', '').strip()
    user_data = verify_token(token)

    if user_data is not None:
        is_group = request.get_json()['is_group']
        id_target = request.get_json()['id_target']
        group_name = request.get_json()['group_name']

        return consultar_mensagens(user_data['id'], is_group, id_target, group_name)
    else:
        return jsonify({'error': 'Token inválido'}), 401


# =============================================== ROTA DE GRUPOS =======================================================
# =============================================== ROTA DE GRUPOS =======================================================
# =============================================== ROTA DE GRUPOS =======================================================


@app.route("/get_groups", methods=['GET'])
def get_groups():
    token = request.headers['Authorization'][7:]
    user_data = verify_token(token)

    if user_data is not None:
        with connection() as conn:
            cursor = conn.cursor()
            groups = []
            consulta = cursor.execute(
                f"SELECT CONVERSATION_ID, CONVERSATION_NAME FROM CONVERSATIONS WHERE IS_GROUP = 1 "
                f"AND CONVERSATION_ID IN (SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS "
                f"WHERE MEMBER_ID = {user_data['id']}) ORDER BY CONVERSATION_NAME ASC").fetchall()
            for group in consulta:
                groups.append({'id': group[0], 'nome': group[1]})
            return groups
    else:
        return jsonify({'error': 'Token inválido'}), 401


# ============================================== ROTA DE CONTATOS ======================================================
# ============================================== ROTA DE CONTATOS ======================================================
# ============================================== ROTA DE CONTATOS ======================================================


@app.route("/get_contacts", methods=['GET'])
def get_contacts():
    token = request.headers['Authorization'].replace('Bearer ', '').strip()
    user_data = verify_token(token)

    if user_data is not None:
        with connection() as conn:
            cursor = conn.cursor()
            consulta = cursor.execute("SELECT USER_ID, NOME FROM USUARIOS ORDER BY NOME ASC").fetchall()
            contacts = []
            for contact in consulta:
                contacts.append({'id': contact[0], 'nome': contact[1]})
        return contacts
    else:
        return jsonify({'error': 'Token inválido'}), 401


# ================================================ ROTA DE UPLOAD ======================================================
# ================================================ ROTA DE UPLOAD ======================================================
# ================================================ ROTA DE UPLOAD ======================================================


@app.route("/upload", methods=['POST'])
def upload():
    data = request.files.get("file")
    if data is not None:
        data.save(os.path.join(diretorio, data.filename))
        return '', 201
    else:
        return '', 404


# ============================================== ROTA DE DOWNLOAD ======================================================
# ============================================== ROTA DE DOWNLOAD ======================================================
# ============================================== ROTA DE DOWNLOAD ======================================================


@app.route("/download/<filename>", methods=['GET'])
def download(filename):
    return send_from_directory(diretorio, filename)


if __name__ == '__main__':
    app_with_socketio = socketio.WSGIApp(sio, app)
    eventlet.wsgi.server(eventlet.listen((local_ip, 5000)), app_with_socketio)
