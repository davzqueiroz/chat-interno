import socketio

available_users = []
caracteres_especiais = [
    "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/",
    ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "`", "{", "|", "}", "~",
    "¢", "£", "¤", "¥", "§", "©", "®", "°", "±", "µ", "¶", "¿", "×", "÷",
    "¼", "½", "¾", "⅓", "⅔", "⅛", "⅜", "⅝", "⅞",
    "¡", "¿",
    "¬", "¯", "¨", "ˆ", "˜", "´", "`", "^", "¸", "ª", "º",
    "Æ", "Œ", "Ł", "Ŧ", "Ø", "Ð", "Þ", "ß", "æ", "œ", "ł", "ŧ", "ø", "ð", "þ",
    "ƒ", "ə", "ʃ", "ʒ", "ʔ", "ʊ", "ʌ", "ʍ", "ʎ", "ʏ", "ʜ", "ʝ", "ʡ"]

# Crie uma instância do cliente Socket.IO
sio = socketio.Client()

while True:
    client_name = input("Digite seu nome: ")
    contem_caracter_especial = False

    # Verifique se o nome do cliente contém caracteres especiais
    for caracter in caracteres_especiais:
        if caracter in client_name:
            print("Caracteres especiais não são permitidos no nome!!")
            contem_caracter_especial = True
            break  # Saia do loop se um caractere especial for encontrado

    # Se não houver caracteres especiais no nome, saia do loop
    if not contem_caracter_especial:
        break

# URL do servidor
server_url = 'http://127.0.0.1:5000'

sio.connect('http://127.0.0.1:5000', auth={'name': client_name})


# Evento para enviar mensagens ao servidor
def send_message(recipient, message):
    sio.emit('send_message', {'recipient': recipient, 'message': message, 'autor': client_name})


# Evento para receber mensagens do servidor
@sio.on('message')
def on_message(data):
    print(f"\nMensagem de {recipient_name}: {data} "
          f"\n"
          f"\nDigite sua mensagem: ")


@sio.on('connected_users')
def handle_users(data):
    print(data)
    available_users = data
    print(available_users)


# Receber nome do destinatário
recipient_name = input("Digite o destino: ")

# Enviar o nome do cliente para o servidor


while True:
    # Mensagem que vai enviar para o destinatário
    message = input("Digite sua mensagem: ")
    send_message(recipient_name, message)


# Mantenha o cliente em execução
sio.wait()