import sqlite3
import jwt
import socketio


def connection():
    conn = sqlite3.connect('backend/bank_webchat')
    return conn


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

        consulta_mensagens = cursor.execute(f"SELECT * FROM (SELECT * FROM MESSAGES WHERE CONVERSATION_ID = {conversation_target} ORDER BY SENT_AT DESC LIMIT 20) AS SUBQUERY ORDER BY SENT_AT ASC").fetchall()
        mensagens = []
        for mensagem in consulta_mensagens:
            consulta_response = 0
            if mensagem[6] is not None and mensagem[6] != 0:
                consulta_response = cursor.execute(f"SELECT * FROM MESSAGES WHERE MESSAGE_ID = {mensagem[6]}").fetchone()
                consulta_response = {'id': consulta_response[0], 'conversation_id': consulta_response[1], 'sender_id': consulta_response[2], 'content': consulta_response[3], 'sent_at': consulta_response[4], 'type': consulta_response[5], 'author_name': consulta_nome(consulta_response[2])}
            mensagens.append({'id': mensagem[0], 'conversation_id': mensagem[1], 'sender_id': mensagem[2], 'content': mensagem[3], 'sent_at': mensagem[4], 'type': mensagem[5], 'author_name': consulta_nome(mensagem[2]), 'response_to': consulta_response, 'is_group': is_group})
        return mensagens


def consulta_conversation_id(my_id, id_target):
    with connection() as conn:
        for c in range(2):
            cursor = conn.cursor()
            consulta = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS WHERE MEMBER_ID = {my_id} AND CONVERSATION_ID IN (SELECT CONVERSATION_ID FROM CONVERSATION_MEMBERS WHERE MEMBER_ID = {id_target})").fetchall()
            consulta = ','.join(map(str, [t[0] for t in consulta]))
            id_pvs = cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE IS_GROUP = 0 AND CONVERSATION_ID IN ({consulta})").fetchone()
            if id_pvs is None:
                cursor.execute(f"INSERT INTO CONVERSATIONS (CONVERSATION_NAME, IS_GROUP) VALUES (NULL, 0)")
                cursor.execute(f"INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, MEMBER_ID) VALUES ((SELECT CONVERSATION_ID FROM CONVERSATIONS ORDER BY CONVERSATION_ID DESC LIMIT 1), {my_id})")
                cursor.execute(f"INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, MEMBER_ID) VALUES ((SELECT CONVERSATION_ID FROM CONVERSATIONS ORDER BY CONVERSATION_ID DESC LIMIT 1), {id_target})")
                conn.commit()

        return id_pvs[0]


def consulta_nome(id):
    with connection() as conn:
        cursor = conn.cursor()
        try:
            consulta = cursor.execute(f"SELECT NOME FROM USUARIOS WHERE USER_ID = {id}").fetchone()
            return consulta[0]
        except TypeError:
            consulta = cursor.execute(f"SELECT CONVERSATION_NAME FROM CONVERSATIONS WHERE CONVERSATION_ID = {id}").fetchone()
            return consulta[0]


def insert_message(conversation_id, author_id, message, response_to, client_id):
    with connection() as conn:
        cursor = conn.cursor()
        if response_to is not None:
            response_to = cursor.execute(f"SELECT MESSAGE_ID FROM MESSAGES WHERE CLIENT_ID = '{response_to}' OR MESSAGE_ID = {response_to}").fetchone()[0]
        elif response_to is None:
            response_to = 'NULL'
        cursor.execute(f"INSERT INTO MESSAGES (CONVERSATION_ID, SENDER_ID, CONTENT, SENT_AT, MESSAGE_TYPE, RESPONSE_TO, CLIENT_ID) VALUES ({conversation_id}, {author_id}, '{message}', DATETIME('now','localtime'), 'TEXT', {response_to}, '{client_id}')")
        conn.commit()  # Ao enviar mensagens salvar no banco de dados


def verify_token(token):
    try:
        user_data = jwt.decode(token, "webchat", algorithms=["HS256"])
        return user_data
    except jwt.exceptions.InvalidSignatureError:
        return None
    except jwt.exceptions.ExpiredSignatureError:
        return None
    except jwt.exceptions.DecodeError:
        return None
    except jwt.exceptions.InvalidTokenError:
        return None


def consulta_message_id(author_id, message, conversation_id, sent_at):
    with connection() as conn:
        cursor = conn.cursor()
        consulta = cursor.execute(f"SELECT MESSAGE_ID FROM MESSAGES WHERE SENDER_ID = {author_id} AND CONTENT = '{message}' AND CONVERSATION_ID = {conversation_id} AND SENT_AT = '{sent_at}'").fetchall()
        message_id = consulta[len(consulta) - 1][0]
        return message_id


def consulta_message_using_client_id(client_id):
    with connection() as conn:
        cursor = conn.cursor()
        if client_id is not None:
            consulta_response = cursor.execute(f"SELECT * FROM MESSAGES WHERE MESSAGE_ID = {client_id} OR CLIENT_ID = '{client_id}'").fetchone()
            consulta_response = {'id': consulta_response[0], 'conversation_id': consulta_response[1],
                                 'sender_id': consulta_response[2], 'content': consulta_response[3],
                                 'sent_at': consulta_response[4], 'type': consulta_response[5],
                                 'author_name': consulta_nome(consulta_response[2])}
            return consulta_response
        else:
            return None
