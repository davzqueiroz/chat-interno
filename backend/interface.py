import customtkinter as ctk
import tkinter as tk
from tkinter import ttk
import socketio
import threading

mensagens = []
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
message_received = None
message_sended = None
running = False
y = 10

# Crie uma instância do cliente Socket.IO
sio = socketio.Client()

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")
janela = ctk.CTk()
janela.title("CHAT PARCOL")
janela.geometry('300x500')
janela.resizable(width=False, height=False)


def press_enter_login(event):
    enviar_nome_senha.invoke()


def press_enter_destino(event):
    go_chat.invoke()


def press_enter_msg(event):
    botao_enviar_msg.invoke()


def login():
    global server_url, client_name, client_senha
    input_nome.place_forget()
    input_senha.place_forget()
    enviar_nome_senha.place_forget()

    client_name = input_nome.get()
    client_senha = input_senha.get()
    print(client_name, client_senha)

    # URL do servidor
    server_url = 'http://127.0.0.1:5000'
    sio.connect('http://127.0.0.1:5000', auth={'name': client_name})

    input_recipient_name.place(x=80, y=50)
    go_chat.place(x=80, y=120)


# Evento para enviar mensagens ao servidor
def send_message(recipient, message):
    sio.emit('send_message', {'recipient': recipient, 'message': message, 'autor': client_name})


@sio.on('connected_users')
def handle_users(data):
    print(data)
    available_users = data
    print(available_users)


def enviar_msg():
    global write_text, recipient_name, botao_enviar_msg, message_sended, sframe, y

    # Mensagem que vai enviar para o destinatário
    message = write_text.get()
    message_sended = f"\n Você: {message} "
    send_message(recipient_name, message)
    show_messages = ctk.CTkLabel(sframe, text=message_sended, font=("arial bold", 12), compound='left')
    show_messages.pack()
    write_text.delete("0", "end")


def chat():
    global botao_enviar_msg, write_text, recipient_name, message_received, running, sframe, y

    recipient_name = input_recipient_name.get()
    #input_recipient_name.place_forget()
    #go_chat.place_forget()

    janela_chat = ctk.CTkToplevel()
    janela_chat.title("Chat com " + recipient_name)
    janela_chat.geometry('600x400')
    janela_chat.resizable(width=False, height=False)

    write_text = ctk.CTkEntry(janela_chat, placeholder_text="Digite aqui...", width=460, height=80)
    write_text.place(x=20, y=300)

    botao_enviar_msg = ctk.CTkButton(janela_chat, text="Enviar", width=80, height=80, command=enviar_msg)
    botao_enviar_msg.place(x=500, y=300)
    write_text.bind('<Return>', command=press_enter_msg)

    sframe = ctk.CTkScrollableFrame(janela_chat, width=540, height=200)
    sframe.place(x=20, y=20)


    @sio.on('message')
    def on_message(data):
        global message_received, y
        message_received = f"\n Mensagem de {recipient_name}: {data}"
        show_messages = ctk.CTkLabel(sframe, text=message_received, font=("arial bold", 12))
        show_messages.pack()
        print(message_received)

def thread_chat():
    global running
    running = True
    var_thread_chat = threading.Thread(target=chat)
    var_thread_chat.start()


# ======================================================================================================================
# ======================================================================================================================
# ======================================================================================================================

input_nome = ctk.CTkEntry(janela, placeholder_text="Nome...")
input_nome.place(x=80, y=50)

input_senha = ctk.CTkEntry(janela, placeholder_text="Senha...", show="*")
input_senha.place(x=80, y=120)

enviar_nome_senha = ctk.CTkButton(janela, text="Login", command=login)
enviar_nome_senha.place(x=80, y=190)

input_senha.bind("<Return>", command=press_enter_login)

# ======================================================================================================================
# ======================================================================================================================
# ======================================================================================================================

input_recipient_name = ctk.CTkEntry(janela, placeholder_text="Destinatário...")
input_recipient_name.place_forget()

go_chat = ctk.CTkButton(janela, text="Ir para o CHAT", command=thread_chat)
go_chat.place_forget()

input_recipient_name.bind("<Return>", command=press_enter_destino)

# ======================================================================================================================
# ======================================================================================================================
# ======================================================================================================================

sio.wait()

janela.mainloop()