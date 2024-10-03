from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
sio = SocketIO(app)


client_connections = []  # Dicionário para mapear identificação de conexão (request.sid) aos nomes dos clientes


@sio.event
def connect(sid, environ, auth):
    print(f"Conectado: {auth['name']}")
    print(f"SID de {auth['name']}: {sid}")
    client_connections.append({'name': auth['name'], 'sid': sid})
    print(f"Clientes conectados: {client_connections}\n")
    sio.emit('connected_users', client_connections)


@sio.event
def disconnect(sid):
    print('Desconectado: ', sid)
    # Remover usuarios desconectados da array
    sio.emit('connected_users', client_connections)


@sio.on('send_message')
def send_message(target, data):
    print(data, target)
    recipient = data['recipient']  # Nome do destinatário
    message = data['message']
    autor = data['autor']

    for connection in client_connections:
        if connection['name'] == recipient:
            sio.emit('message', message, room=connection['sid'])  # Envia a mensagem apenas para o destinatário

            # Adicione uma instrução de depuração para imprimir as mensagens recebidas no servidor
            print(f"Mensagem recebida no servidor de {autor} para {recipient}: {message}")


if __name__ == '__main__':
    sio.run(app, allow_unsafe_werkzeug=True)