import { server } from '../js/server.js';
const messages_contacts = new Map();
const lista_mensagens = document.getElementById('lista-mensagens');
const botao_enviar = document.getElementById('botao-enviar');
const input_message = document.getElementById('input-message');

const socket = io('http://192.168.0.37:5000/', {
	extraHeaders: {
		Authorization: localStorage.getItem('authToken'),
	},
});

socket.on('connect', () => {
	
});

socket.on('disconnect', () => {
	localStorage.removeItem('authToken');
	window.location.href = '/';
});

socket.io.on('reconnect', () => {});

// ============================ Evento para receber clientes conectados ============================== //
// ============================ Evento para receber clientes conectados ============================== //
// ============================ Evento para receber clientes conectados ============================== //

socket.on('receive_client_connections', (client_connections) => {
	let listaContatos = Array.from(lista.getElementsByTagName('li'));
	if (listaContatos.length <= 0){
		setTimeout(loadStatus(client_connections, listaContatos), 100)
		return 
	}
	loadStatus(client_connections, listaContatos)
});

function loadStatus(client_connections, listaContatos) {
	
	listaContatos = listaContatos.filter((contact) => !contact.innerText.startsWith('GRUPO'))

	listaContatos.forEach((contato) => {
		const status = contato.querySelector('span')
		if (client_connections.includes(contato.innerText)){
			status.classList.remove('offline');
			status.classList.add('online')
		}
		else {
			status.classList.remove('online');
			status.classList.add('offline')
		}
	})
}

// ==================================== Evento para receber mensagens ================================ //
// ==================================== Evento para receber mensagens ================================ //
// ==================================== Evento para receber mensagens ================================ //

socket.on('message', (data) => {

	if (!messages_contacts.has(data['author_id'])) messages_contacts.set(data['author_id'], []);
	const history = messages_contacts.get(data['author_id']);
	history.push({
		id: 0,
		conversation_id: 0,
		sender_id: data['author_id'],
		content: data['message'],
	});

	if (data['author_id'] == contato_atual['id']) {
		const msg = document.createElement('li');
        msg.classList.add('received');
        
        const msgContent = document.createElement('div');
        msgContent.innerText = data['message'];
        
        const msgTime = document.createElement('span');
        msgTime.classList.add('message-time');
        msgTime.innerText = formatCurrentTime();

        msg.appendChild(msgContent);
        msg.appendChild(msgTime);

        lista_mensagens.appendChild(msg);

		const messageContainer = document.querySelector('.messages-chat');
		messageContainer.scrollTop = messageContainer.scrollHeight;
	}

	if (data['author_id'] !== contato_atual['id']) {
		let listaContatos = Array.from(lista.getElementsByTagName('li'));
		listaContatos.forEach((contato) => {
			if(data['author_name'] == contato.innerText){contato.style.backgroundColor = "#344af0"}
		})
	}

});

// ============================ Pegar informações do usuário através do token ======================== //
// ============================ Pegar informações do usuário através do token ======================== //
// ============================ Pegar informações do usuário através do token ======================== //

const token = localStorage.getItem('authToken');
if (!token) window.location.href = '/';

const user_data = (() => {
	try {
		return jwt_decode(token);
	} catch (error) {
		window.location.href = '/';
	}
})();

document.getElementById('nome-contato').innerText = user_data['nome'];

// ======================== Função para alterar entre contatos e configurações ======================= //
// ======================== Função para alterar entre contatos e configurações ======================= //
// ======================== Função para alterar entre contatos e configurações ======================= //

function togglePanel() {
	const contactPanel = document.getElementById('contactPanel');
	const settingsPanel = document.getElementById('settingsPanel');

	if (contactPanel.classList.contains('active')) {
		contactPanel.classList.remove('active');
		settingsPanel.classList.add('active');
	} else {
		settingsPanel.classList.remove('active');
		contactPanel.classList.add('active');
	}
}

document.getElementById('settingsButton').addEventListener('click', togglePanel);
document.getElementById('contactsButton').addEventListener('click', togglePanel);

// ======================================= Função para logout ======================================== //
// ======================================= Função para logout ======================================== //
// ======================================= Função para logout ======================================== //

document.getElementById('sair').addEventListener('click', () => {
	localStorage.removeItem('authToken');
	window.location.href = '/';
});

// =============================== Função para inserir mensagens no HTML ============================= //
// =============================== Função para inserir mensagens no HTML ============================= //
// =============================== Função para inserir mensagens no HTML ============================= //

function insertMessageHTML(contato, is_group) {
	const value_textbar = document.getElementById('input-message').value;
	const mensagem = document.createElement('li');

	if (value_textbar.trim() !== '') {
		const msg = document.createElement('li');
        msg.classList.add('sended');
        
        const msgContent = document.createElement('div');
        msgContent.innerText = value_textbar;
        
        const msgTime = document.createElement('span');
        msgTime.classList.add('message-time');
        msgTime.innerText = formatCurrentTime();

        msg.appendChild(msgContent);
        msg.appendChild(msgTime);

        lista_mensagens.appendChild(msg);

		const messageContainer = document.querySelector('.messages-chat');
		messageContainer.scrollTop = messageContainer.scrollHeight;

	}

	document.getElementById('input-message').value = '';

	if (!messages_contacts.has(contato['id'])) messages_contacts.set(contato['id'], []);
	const history = messages_contacts.get(contato['id']);
	history.push({
		id: 0,
		conversation_id: 0,
		sender_id: user_data['id'],
		content: value_textbar,
		sent_at: getFormattedDate()
	});

	if (value_textbar.trim() !== '') {
		socket.emit('send_message', {
			target_id: contato_atual['id'],
			message: value_textbar,
			author_id: user_data['id'],
			conversation_id: '',
			is_group: is_group
		});
	}

	// messages_contacts.set(contato['id'], history)
}

// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //

document.getElementById('foto-usuario').src = 'http://192.168.0.37:5000/static/images/usuarios/' + user_data['nome'] +'.png'

// ============================================ Grupos dinâmicos ===================================== //
// ============================================ Grupos dinâmicos ===================================== //
// ============================================ Grupos dinâmicos ===================================== //

var contato_atual = '';

async function get_groups() {
	try {
		const { data } = await server('/get_groups');

		for (const group of data) {
			const grupo = document.createElement('li');
			grupo.innerText = 'GRUPO - ' + group['nome'];

			grupo.addEventListener('click', function editContactName() {
				document.getElementById('nome-contato').innerText = group['nome'];
				document.getElementById('foto-usuario').src = 'http://192.168.0.37:5000/static/images/usuarios/parcol.png'
				document.querySelector('.input-msg').style.visibility = 'visible';
				showMessages(group, true, group['nome']);

				botao_enviar.onclick = function () {
					insertMessageHTML(group, true);
				};

				input_message.onkeydown = (event) => {
					if (event.key == 'Enter' && !event.shiftKey) {
						event.preventDefault();
						insertMessageHTML(group, true);
					}
				};
				
				contato_atual = group;
			});

			lista.appendChild(grupo);
		}
	} catch (error) {
		console.log(error);
	}
}

// =========================================== Contatos dinâmicos ==================================== //
// =========================================== Contatos dinâmicos ==================================== //
// =========================================== Contatos dinâmicos ==================================== //

var contato_atual = '';
const lista = document.getElementById('lista-contatos');

async function get_contacts() {
	try {
		const { data } = await server('/get_contacts');

		for (const contact of data) {
			if (contact['id'] == user_data['id']) continue;
			const contato = document.createElement('li');
			contato.innerText = contact['nome'];

			const statusSpan = document.createElement('span');
			statusSpan.classList.add('status');
			statusSpan.classList.add('offline');
			contato.prepend(statusSpan);

			contato.addEventListener('click', function editContactName() {
				document.getElementById('nome-contato').innerText = contact['nome'];
				document.getElementById('foto-usuario').src = 'http://192.168.0.37:5000/static/images/usuarios/' + contact['nome'] +'.png'
				document.querySelector('.input-msg').style.visibility = 'visible';
				contato.style.backgroundColor = "#202b7a";
				showMessages(contact, false, '');

				botao_enviar.onclick = function () {
					insertMessageHTML(contact, false);
				};

				input_message.onkeydown = (event) => {
					if (event.key == 'Enter' && !event.shiftKey) {
						event.preventDefault();
						insertMessageHTML(contact, false);
					}
				};

				contato_atual = contact;
			});

			lista.appendChild(contato);
		}
	} catch (error) {
		console.log(error);
	}
}

get_groups().then(() => get_contacts());


// ======================================= Mensagens dinâmicas ======================================== //
// ======================================= Mensagens dinâmicas ======================================== //
// ======================================= Mensagens dinâmicas ======================================== //

async function showMessages(contact, is_group, group_name) {
	lista_mensagens.innerText = '';
	if (messages_contacts.has(contact['id'])) {
		render_messages(messages_contacts.get(contact['id']));
		return;
	}
	try {
		const { data } = await server.post('/get_messages', {
			is_group: is_group,
			id_target: contact['id'],
			group_name: group_name,
		});
		messages_contacts.set(contact['id'], data);
		render_messages(data);

	} catch (error) {
		console.log(error);
	}
}

// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //
// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //
// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //

function render_messages(messages, is_group) {

	messages.forEach((element) => {
		const msg = document.createElement('li');
        msg.classList.add(element['sender_id'] == user_data['id'] ? 'sended' : 'received');
        
        const msgContent = document.createElement('div');
        msgContent.innerText = element['content'];
        
        const msgTime = document.createElement('span');
        msgTime.classList.add('message-time');
		if (is_group && element['sender_id'] == user_data['id']) {msgTime.innerText = user_data['nome'] + ' - ' + formatTime(element['sent_at'])}
        else if (is_group && element['sender_id'] !== user_data['id'] ) {msgTime.innerText = 'Outro usuário - ' + formatTime(element['sent_at'])}
		else if (!is_group) {msgTime.innerText = formatTime(element['sent_at'])}

        msg.appendChild(msgContent);
        msg.appendChild(msgTime);

        lista_mensagens.appendChild(msg);
	});
	const messageContainer = document.querySelector('.messages-chat');
	messageContainer.scrollTop = messageContainer.scrollHeight;
}

// ============================================== FORMATAR HORARIOS ========================================= //
// ============================================== FORMATAR HORARIOS ========================================= //
// ============================================== FORMATAR HORARIOS ========================================= //

function formatTime(timestamp) {
    const [datePart, timePart] = timestamp.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatCurrentTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getFormattedDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ================================================ PAINEL DE ANEXO ========================================= //
// ================================================ PAINEL DE ANEXO ========================================= //
// ================================================ PAINEL DE ANEXO ========================================= //

// function toggleAttachmentPanel() {
//     const panel = document.getElementById('attachmentPanel');
//     panel.classList.toggle('open');
// }

// // Função para fechar o painel ao clicar fora
// document.addEventListener("click", function(event) {
//     const panel = document.getElementById("attachmentPanel");
//     const button = document.querySelector("image-anexo");

//     // Verifica se o clique foi fora do painel e fora do botão de anexo
//     if (!panel.contains(event.target) && !button.contains(event.target)) {
//       panel.classList.remove("open"); // Fecha o painel
//     }
//   });
