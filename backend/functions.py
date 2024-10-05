import sqlite3


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

        consulta_mensagens = cursor.execute(f"SELECT * FROM MESSAGES WHERE CONVERSATION_ID = {conversation_target} ORDER BY SENT_AT").fetchall()
        mensagens = []
        for mensagem in consulta_mensagens:
            mensagens.append({'id': mensagem[0], 'conversation_id': mensagem[1], 'sender_id': mensagem[2], 'content': mensagem[3], 'sent_at': mensagem[4], 'type': mensagem[5]})
        return mensagens

        # print(cursor.execute(f"SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE IS_GROUP = {is_group} AND CONVERSATION_ID IN ({retorno})").fetchall())


