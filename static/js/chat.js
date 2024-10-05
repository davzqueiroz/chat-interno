import { server } from '../js/server.js';
const messages_contacts = new Map();
const lista_mensagens = document.getElementById('lista-mensagens');
const botao_enviar = document.getElementById('botao-enviar');
const input_message = document.getElementById('input-message');

const socket = io('http://localhost:5000/', {
	extraHeaders: {
		Authorization: localStorage.getItem('authToken'),
	},
});

socket.on('connect', () => {
	console.log(socket); // true
	// EXIBIR PRO USUARIO SE ELE ESTÁ CONECTADO
});

socket.on('disconnect', () => {
	// EXIBIR PRO USUARIO SE ELE ESTÁ DESCONECTADO
	console.log(socket.connected); // false
	//Fazer
	localStorage.removeItem('authToken');
	window.location.href = '/';
	//
});
socket.io.on('reconnect', () => {});

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

function insertMessageHTML(contato) {
	console.log(contato);
	const value_textbar = document.getElementById('input-message').value;
	const mensagem = document.createElement('li');

	if (value_textbar.trim() !== '') {
		mensagem.innerText = value_textbar;
		mensagem.classList.add('sended');

		document.getElementById('lista-mensagens').appendChild(mensagem);

		const messageContainer = document.querySelector('.messages-chat');
		messageContainer.scrollTop = messageContainer.scrollHeight;
	}

	document.getElementById('input-message').value = '';

	if (!messages_contacts.has(contato['id'])) messages_contacts.set(contato['id'], []);
	const history = messages_contacts.get(contato['id']);
	history.push({
		id: 3,
		conversation_id: 3,
		sender_id: 1,
		content: value_textbar,
	});
	//socket.emit('');
	// messages_contacts.set(contato['id'], history)
}

// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //

document.addEventListener('DOMContentLoaded', async (event) => {
	const foto_user = document.getElementById('foto-usuario');
	foto_user.src = 'https://github.com/davzqueiroz.png';
});

// =========================================== Contatos dinâmicos ==================================== //
// =========================================== Contatos dinâmicos ==================================== //
// =========================================== Contatos dinâmicos ==================================== //

const lista = document.getElementById('lista-contatos');

async function get_contacts() {
	try {
		const { data } = await server('/get_contacts');

		for (const contact of data) {
			if (contact['id'] == 1) continue;
			console.log(contact);
			const contato = document.createElement('li');
			contato.innerText = contact['nome'];
			contato.addEventListener('click', function editContactName() {
				document.getElementById('nome-contato').innerText = contact['nome'];
				showMessages(contact);
				botao_enviar.onclick = function () {
					insertMessageHTML(contact);
				};
				input_message.onkeydown = (event) => {
					if (event.key == 'Enter' && !event.shiftKey) {
						event.preventDefault();
						insertMessageHTML(contact);
					}
				};
			});

			lista.appendChild(contato);
		}
	} catch (error) {
		console.log(error);
	}
}

get_contacts();

// ======================================= Mensagens dinâmicas ======================================== //
// ======================================= Mensagens dinâmicas ======================================== //
// ======================================= Mensagens dinâmicas ======================================== //

async function showMessages(contact) {
	lista_mensagens.innerText = '';
	if (messages_contacts.has(contact['id'])) {
		render_messages(messages_contacts.get(contact['id']));
		return;
	}
	try {
		const { data } = await server.post('/get_messages', {
			my_id: 1,
			is_group: false,
			id_target: contact['id'],
			group_name: '',
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

function render_messages(messages) {
	messages.forEach((element) => {
		const msg = document.createElement('li');
		msg.classList.add(element['sender_id'] == 1 ? 'sended' : 'received');
		msg.innerText = element['content'];
		lista_mensagens.appendChild(msg);
	});
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
