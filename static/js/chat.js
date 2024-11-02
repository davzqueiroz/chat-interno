import { server } from '../js/server.js';

const ip_server = 'http://192.168.0.37:5000/'
const messages_contacts = new Map();
const lista_mensagens = document.getElementById('lista-mensagens');
const botao_enviar = document.getElementById('botao-enviar');
const botao_anexo = document.getElementById('image-anexo');
const input_message = document.getElementById('input-message');
const lista = document.getElementById('lista-contatos');

const socket = io(ip_server, {
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
		setTimeout(loadStatus(client_connections, listaContatos), 150)
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

const audio_notify = new Audio('static/audios/new_message.mp3')
audio_notify.volume = 0.2

socket.on('message', (data) => {

	// INSERE AS MENSAGENS NA MEMÓRIA LOCAL CASO JÁ TENHA CONSULTADO NO BANCO
	if (!data['is_group']) {
		if (messages_contacts.has(data['author_id'])) {
			const history = messages_contacts.get(data['author_id']);
			history.push({
				id: data['message_id'],
				conversation_id: 0,
				sender_id: data['author_id'],
				content: data['message'],
				sent_at: getFormattedDate(),
				type: data['type'],
				type_archive: data['type_archive']
			});
		}
	}
	
	else if (data['is_group']){
		if (messages_contacts.has(data['target_id'])) {
			const history = messages_contacts.get(data['target_id']);
			history.push({
				id: data['message_id'],
				conversation_id: 0,
				sender_id: data['author_id'],
				content: data['message'],
				sent_at: getFormattedDate(),
				author_name: data['author_name'],
				type: data['type'],
				type_archive: data['type_archive']
			});
		}
	}

	// SE A PESSOA QUE ENVIOU A MENSAGEM FOR A MESMA QUE SUA CONVERSA ESTÁ ABERTA, CARREGA A MENSAGEM NO HTML
	if (data['author_id'] == contato_atual['id'] && !data['is_group']) {
		insertReceivedHTML(data)
	}

	// SE FOR GRUPO E A MENSAGEM FOR PARA O GRUPO QUE VOCÊ ESTEJA ABERTO, CARREGA A MENSAGEM NO HTML
	if (data['is_group'] && data['target_id'] == contato_atual['id'] && data['author_id'] !== user_data['id']) {
		insertReceivedHTML(data)
	}

	// EMITE NOTIFICAÇÃO CASO A MENSAGEM SEJA PARA A CONVERSA QUE NAO ESTÁ ABERTA
	if (data['author_id'] !== contato_atual['id'] && data['author_id'] !== user_data['id']) {
		let listaContatos = Array.from(lista.getElementsByTagName('li'));
		listaContatos.forEach((contato) => {

			if(data['author_name'] == contato.innerText && !data['is_group']){
				contato.style.backgroundColor = "#344af0"
				audio_notify.play()
			}

			else if (data['is_group'] && 'GRUPO - ' + contato_atual['nome'] !== 'GRUPO - ' + data['group_name']){
				if('GRUPO - ' + data['group_name'] == contato.innerText){
					contato.style.backgroundColor = "#344af0"
					audio_notify.play()
				}
			}
		})


	}
});

function insertReceivedHTML(data) {
	const msg = document.createElement('li');
	msg.classList.add('received');
	
	msg.addEventListener('dblclick', (event) => {
		event.preventDefault()
		showResponseDiv(msg);
	})

	if (data['response_to'] != null){
		const msg_response = document.createElement('div');
		msg_response.classList.add('message-responsed');

		msg_response.innerText = data['response_to']['content']
		const timeofresponse = document.createElement('span');
		timeofresponse.classList.add('message-time');
		if (data['is_group']) {timeofresponse.innerText = data['response_to']['author_name'] + ' - ' + formatTime(data['response_to']['sent_at'])}
		if (!data['is_group']) {timeofresponse.innerText = formatTime(data['response_to']['sent_at'])}
		msg_response.appendChild(timeofresponse);
		
		msg.appendChild(msg_response);
	}

	// Se for uma mensagem de texto, cria a mensagem dentro do padrão de texto
	if (data['type'] == "TEXT") {
		const msgContent = document.createElement('div');
		msgContent.innerText = data['message'];
		
		const msgTime = document.createElement('span');
		msgTime.classList.add('message-time');
	
		if (data['is_group']){
			msgTime.innerText = data['author_name'] + ' - ' + formatCurrentTime();
		}
		else {msgTime.innerText = formatCurrentTime()}

		msg.appendChild(msgContent);
		msg.appendChild(msgTime);
	}

	// Se a mensagem for um arquivo, cria a mensagem dentro do padrão de arquivo
	else if (data['type'] == "BYTES"){
		const msg_attachment = document.createElement('div');
		msg_attachment.classList.add('message-attachment');
		
		const icon_type_archive = document.createElement('div');
		icon_type_archive.classList.add('icon-type-archive');
		if (data['type_archive'].includes("spreadsheet")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/xlsx.png')`;}
		else if (data['type_archive'].includes("pdf")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/pdf.png')`;}
		else if (data['type_archive'].includes("text")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/txt.png')`;}
		else if (data['type_archive'].includes("word")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/word.png')`;}
		else if (data['type_archive'].includes("zip")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/winrar.png')`;}
		else if (data['type_archive'].includes("image")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/image.png')`;}

		const download_button = document.createElement('input');
		download_button.type = 'image';
		download_button.src = ip_server + '/static/images/download.png';
		download_button.classList.add('download-attachment');
		download_button.addEventListener('click', async () => {

			try {
				const response = await server(`download/${data['message']}`, { responseType: 'blob' })
				const url = window.URL.createObjectURL(response['data']);
				const a = document.createElement('a');
				a.href = url;
				a.download = data['message'];
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.log(error)
			}
				
			});

		const msgContent = document.createElement('div');
		msgContent.innerText = data['message'];
		
		const msgTime = document.createElement('span');
		msgTime.classList.add('message-time');
		
		if (data['is_group']){
			msgTime.innerText = data['author_name'] + ' - ' + formatCurrentTime();
		}
		else {msgTime.innerText = formatCurrentTime()}

		msg_attachment.append(icon_type_archive);
		msg_attachment.append(msgContent);
		msg_attachment.append(download_button);
	
		msg.append(msg_attachment);
		msg.append(msgTime);
	}

	msg.id = data['message_id']
	lista_mensagens.appendChild(msg);

	const messageContainer = document.querySelector('.messages-chat');
	messageContainer.scrollTop = messageContainer.scrollHeight;
}

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
document.getElementById('title-page').innerText = 'Chat Parcol - ' + user_data['nome']

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

// Adicionando opções dinamicamente
const lista_opcoes = document.getElementById('lista-opcoes')

let option = document.createElement('li');
option.innerText = 'Enviar aviso'
option.id = 'enviar-aviso'
lista_opcoes.appendChild(option)

option = document.createElement('li');
option.innerText = 'Fechar conversa'
option.id = 'fechar-conversa'
lista_opcoes.appendChild(option)

if (user_data['nivel'] == 2) {
	let option = document.createElement('li');
	option.innerText = "Criar novo usuário"
	option.id = 'novo-usuario'
	lista_opcoes.appendChild(option)
}

option = document.createElement('li');
option.innerText = 'Sair'
option.id = 'sair'
lista_opcoes.appendChild(option)

// ======================= Função para exibir div de resposta nas mensagens ========================== //
// ======================= Função para exibir div de resposta nas mensagens ========================== //
// ======================= Função para exibir div de resposta nas mensagens ========================== //


document.getElementById('botao-x').addEventListener('click', () => {
	document.getElementById('response-msg').style.display = 'none';
	msg_atual = ''
})

var msg_atual = ''

function showResponseDiv(msg){
	msg_atual = msg

	document.getElementById('response-msg').style.display = 'flex';
	if (msg.childElementCount == 2) {
		document.getElementById('msg-of-response').innerText = msg.children[0].innerText;
		const timeofresponse = document.createElement('span');
		timeofresponse.classList.add('message-time');
		timeofresponse.innerText = msg.children[1].innerText
		document.getElementById('msg-of-response').appendChild(timeofresponse);
	}

	if (msg.childElementCount == 3) {
		document.getElementById('msg-of-response').innerText = msg.children[1].innerText
		const timeofresponse = document.createElement('span');
		timeofresponse.classList.add('message-time');
		timeofresponse.innerText = msg.children[2].innerText
		document.getElementById('msg-of-response').appendChild(timeofresponse);
	}
	
}

// ============================== Funções para painel de configurações =============================== //
// ============================== Funções para painel de configurações =============================== //
// ============================== Funções para painel de configurações =============================== //

document.getElementById('enviar-aviso').addEventListener('click', async () => {

	closeConversation()

	document.getElementById('nome-contato').innerText = user_data['nome'];
	document.getElementById('foto-usuario').src = ip_server + '/static/images/usuarios/' + user_data['nome'] +'.png'

	contato_atual = ''
	lista_mensagens.innerText = ''

	document.querySelector('.msg-panel-aviso').style.visibility = 'visible';
	document.querySelector('.contact-panel-aviso').style.visibility = 'visible';
	const contacts = await insertContactsAlert();

	document.getElementById('botao-enviar-aviso').addEventListener('click', () => {
		const msg = document.getElementById('msg-aviso').value;

		if (msg.trim() !== '') {
			sendAlert(msg, contatosToSend, contacts);
		}
		
	})

	

});

const contatosToSend = [];
async function insertContactsAlert() {
	const contacts = [];
	try {
		const { data } = await server('/get_contacts');

		for (const contact of data) {
			if (contact['id'] == user_data['id']) continue;
			const contato = document.createElement('li');
			contato.innerText = contact['nome'];

			contato.addEventListener('click', function selectContactToSend() {
				if (!contatosToSend.includes(contato.innerText)) {
					contato.style.backgroundColor = "#0f173d";
					contatosToSend.push(contato.innerText)
				}
				else if (contatosToSend.includes(contato.innerText)) {
					contato.style.backgroundColor = "#2436928c"
					contatosToSend.splice(contatosToSend.indexOf(contato.innerText), 1)
				}
			});

			document.getElementById('lista-contatos-aviso').appendChild(contato);
			contacts.push(contact)
		}
		return contacts;
	} catch (error) {
		console.log(error);
	}
}

function sendAlert(msg, contatosToSend, contacts) {

	contatosToSend.forEach(contato => {
		contacts.forEach(contact => {
			if (contact.nome == contato) {
				console.log(contact.nome, contato)
				socket.emit('send_message', {
					target_id: contact['id'],
					message: msg,
					author_id: user_data['id'],
					conversation_id: '',
					is_group: false
				});
			}
		});	
	});

};

function closeConversation() {
	document.getElementById('nome-contato').innerText = user_data['nome'];
	document.getElementById('foto-usuario').src = ip_server + '/static/images/usuarios/' + user_data['nome'] +'.png'
	contato_atual = ''
	lista_mensagens.innerText = ''
	document.querySelector('.input-msg').style.visibility = 'hidden';
	document.querySelector('.msg-panel-aviso').style.visibility = 'hidden';
	document.querySelector('.contact-panel-aviso').style.visibility = 'hidden';
	document.getElementById('div-criar-contato').style.display = 'none';
	msg_atual = ''
}

document.getElementById('fechar-conversa').addEventListener('click', () => {
	closeConversation()
});

document.getElementById('sair').addEventListener('click', () => {
	localStorage.removeItem('authToken');
	window.location.href = '/';
});

if (user_data['nivel'] == 2) {
document.getElementById('novo-usuario').addEventListener('click', () => {
	closeConversation()
	document.getElementById('div-criar-contato').style.display = 'flex';

	document.getElementById('button-criar-contato').addEventListener('click', async () => {
		const email = document.getElementById('type-text-criar-contato').value
		const senha = document.getElementById('senha-criar-contato').value
		const nome = document.getElementById('nome-criar-contato').value

		try {
			const response = await server.post('/register', {email: email, senha: senha, nome: nome})
			document.getElementById('type-text-criar-contato').value = ''
			document.getElementById('senha-criar-contato').value = ''
			document.getElementById('nome-criar-contato').value = ''
		} catch (error) {
			window.alert(error);
		}
		
		
	});

});
}

// =============================== Função para inserir mensagens no HTML ============================= //
// =============================== Função para inserir mensagens no HTML ============================= //
// =============================== Função para inserir mensagens no HTML ============================= //

function insertMessageHTML(contato, is_group) {
	const value_textbar = document.getElementById('input-message').value;
	const client_id = Math.random().toString()

	if (value_textbar.trim() == '') {
		return null
	}
	
	const msg = document.createElement('li');
	msg.classList.add('sended');
	
	const msgContent = document.createElement('div');
	msgContent.innerText = value_textbar;
	
	const msgTime = document.createElement('span');
	msgTime.classList.add('message-time');
	msgTime.innerText = formatCurrentTime();

	msg.addEventListener('dblclick', (event) => {
		event.preventDefault()
		showResponseDiv(msg);
	})

	if (!messages_contacts.has(contato['id'])) messages_contacts.set(contato['id'], []);
	const history = messages_contacts.get(contato['id']);
	history.push({
		id: 0,
		conversation_id: 0,
		sender_id: user_data['id'],
		content: value_textbar,
		sent_at: getFormattedDate(),
		response_to: msg_atual['id'] || null,
		client_id: client_id,
		type: "TEXT"
	});

	if (value_textbar.trim() !== '') {
		socket.emit('send_message', {
			target_id: contato_atual['id'],
			message: value_textbar,
			author_id: user_data['id'],
			conversation_id: '',
			is_group: is_group,
			sent_at: getFormattedDate(),
			response_to: msg_atual['id'] || null,
			client_id: client_id
		});
	}

	if (document.getElementById('response-msg').style.display == 'flex'){

		const msg_response = document.createElement('div');
		msg_response.classList.add('message-responsed');

		if (msg_atual.childElementCount == 2) {
			msg_response.innerText = msg_atual.children[0].innerText;
			const timeofresponse = document.createElement('span');
			timeofresponse.classList.add('message-time');
			timeofresponse.innerText = msg_atual.children[1].innerText
			msg_response.appendChild(timeofresponse);
		}
	
		if (msg_atual.childElementCount == 3) {
			msg_response.innerText = msg_atual.children[1].innerText
			const timeofresponse = document.createElement('span');
			timeofresponse.classList.add('message-time');
			timeofresponse.innerText = msg_atual.children[2].innerText
			msg_response.appendChild(timeofresponse);
		}

		msg.appendChild(msg_response);
		document.getElementById('response-msg').style.display = 'none'
		msg_atual = ''

	}

	msg.id = client_id
	msg.appendChild(msgContent);
	msg.appendChild(msgTime);

	lista_mensagens.appendChild(msg);

	const messageContainer = document.querySelector('.messages-chat');
	messageContainer.scrollTop = messageContainer.scrollHeight;

	document.getElementById('input-message').value = '';

}

// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //
// ============================================ Foto dinâmica ======================================== //

document.getElementById('foto-usuario').src = ip_server + '/static/images/usuarios/' + user_data['nome'] +'.png'

// ==================================== Função para enviar anexos ==================================== //
// ==================================== Função para enviar anexos ==================================== //
// ==================================== Função para enviar anexos ==================================== //

async function sendAttachment(event, is_group, contato) {
	let formdata = new FormData();
	formdata.append('file', event.target.files[0]);
	const client_id = Math.random().toString()

	try {
		await server.post('/upload', formdata)

		socket.emit('send_archive', {
			target_id: contato_atual['id'],
			message: event.target.files[0]['name'],
			author_id: user_data['id'],
			is_group: is_group,
			sent_at: getFormattedDate(),
			response_to: msg_atual['id'] || null,
			client_id: client_id,
			type_archive: event.target.files[0]['type']
		});

		if (!messages_contacts.has(contato['id'])) messages_contacts.set(contato['id'], []);
		const history = messages_contacts.get(contato['id']);
		history.push({
			id: 0,
			conversation_id: 0,
			sender_id: user_data['id'],
			content: event.target.files[0]['name'],
			sent_at: getFormattedDate(),
			response_to: msg_atual['id'] || null,
			client_id: client_id,
			type: "BYTES",
			type_archive: event.target.files[0]['type']
		});

		const msg = document.createElement('li');
		msg.classList.add('sended');

		const msg_attachment = document.createElement('div');
		msg_attachment.classList.add('message-attachment');
		
		const icon_type_archive = document.createElement('div');
		icon_type_archive.classList.add('icon-type-archive');
		if (event.target.files[0]['type'].includes("spreadsheet")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/xlsx.png')`;}
		else if (event.target.files[0]['type'].includes("pdf")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/pdf.png')`;}
		else if (event.target.files[0]['type'].includes("text")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/txt.png')`;}
		else if (event.target.files[0]['type'].includes("word")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/word.png')`;}
		else if (event.target.files[0]['type'].includes("zip")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/winrar.png')`;}
		else if (event.target.files[0]['type'].includes("image")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/image.png')`;}

		const download_button = document.createElement('input');
		download_button.type = 'image';
		download_button.src = ip_server + '/static/images/download.png';
		download_button.classList.add('download-attachment');
		download_button.addEventListener('click', async () => {

			try {
				const response = await server(`download/${event.target.files[0]['name']}`, { responseType: 'blob' })
				const url = window.URL.createObjectURL(response['data']);
				const a = document.createElement('a');
				a.href = url;
				a.download = event.target.files[0]['name'];
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.log(error)
			}
				
			});

		const msgContent = document.createElement('div');
		msgContent.innerText = event.target.files[0]['name'];
		
		const msgTime = document.createElement('span');
		msgTime.classList.add('message-time');
		msgTime.innerText = formatCurrentTime();

		msg_attachment.append(icon_type_archive);
		msg_attachment.append(msgContent);
		msg_attachment.append(download_button);

		if (document.getElementById('response-msg').style.display == 'flex'){

			const msg_response = document.createElement('div');
			msg_response.classList.add('message-responsed');
	
			if (msg_atual.childElementCount == 2) {
				msg_response.innerText = msg_atual.children[0].innerText;
				const timeofresponse = document.createElement('span');
				timeofresponse.classList.add('message-time');
				timeofresponse.innerText = msg_atual.children[1].innerText
				msg_response.appendChild(timeofresponse);
			}
		
			if (msg_atual.childElementCount == 3) {
				msg_response.innerText = msg_atual.children[1].innerText
				const timeofresponse = document.createElement('span');
				timeofresponse.classList.add('message-time');
				timeofresponse.innerText = msg_atual.children[2].innerText
				msg_response.appendChild(timeofresponse);
			}
	
			msg.appendChild(msg_response);
			document.getElementById('response-msg').style.display = 'none'
			msg_atual = ''
	
		}
	

		msg.append(msg_attachment);
		msg.append(msgTime);
		
		lista_mensagens.append(msg)

		const messageContainer = document.querySelector('.messages-chat');
		messageContainer.scrollTop = messageContainer.scrollHeight;

	} catch (error) {
		console.log(error)
	}
};

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
				closeConversation()

				document.getElementById('nome-contato').innerText = group['nome'];
				document.getElementById('foto-usuario').src = ip_server + '/static/images/usuarios/parcol.png'
				document.querySelector('.input-msg').style.visibility = 'visible';
				showMessages(group, true, group['nome']);
				grupo.style.backgroundColor = "#202b7a";

				botao_enviar.onclick = function () {
					insertMessageHTML(group, true);
				};

				botao_anexo.addEventListener('change', async (event) => {
					sendAttachment(event, true, group);
				});

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
				closeConversation()

				document.getElementById('nome-contato').innerText = contact['nome'];
				document.getElementById('foto-usuario').src = ip_server + '/static/images/usuarios/' + contact['nome'] +'.png'
				document.querySelector('.input-msg').style.visibility = 'visible';
				contato.style.backgroundColor = "#202b7a";
				showMessages(contact, false, '');

				botao_enviar.onclick = function () {
					insertMessageHTML(contact, false);
				};

				botao_anexo.addEventListener('change', async (event) => {
					sendAttachment(event, false, contact);
				});
				
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
		render_messages(messages_contacts.get(contact['id']), is_group);
		return;
	}

	try {
		const data = await get_messages(contact, is_group, group_name)
		messages_contacts.set(contact['id'], data);
		render_messages(data, is_group);

	} catch (error) {
		console.log(error);
	}
}

async function get_messages(contact, is_group, group_name){
	try {
		const { data } = await server.post('/get_messages', {
			is_group: is_group,
			id_target: contact['id'],
			group_name: group_name,
		});
		return data
	} catch (error) {
		return []
	}
}

// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //
// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //
// ========================================= RENDERIZAR AS MENSAGENS NO HTML ============================== //

function render_messages(messages, is_group) {
	messages.forEach((element) => {
		console.log(element)
		const msg = document.createElement('li');
        msg.classList.add(element['sender_id'] == user_data['id'] ? 'sended' : 'received');
		
		// Adiciona a DIV de resposta caso a mensagem seja resposta a alguma outra
		if (element['response_to'] != null){
			const msg_response = document.createElement('div');
			msg_response.classList.add('message-responsed');

			msg_response.innerText = element['response_to']['content']
			const timeofresponse = document.createElement('span');
			timeofresponse.classList.add('message-time');
			if (element['is_group']) {timeofresponse.innerText = element['response_to']['author_name'] + ' - ' + formatTime(element['response_to']['sent_at'])}
			if (!element['is_group']) {timeofresponse.innerText = formatTime(element['response_to']['sent_at'])}
			msg_response.appendChild(timeofresponse);
			
			msg.appendChild(msg_response);
		}

		// Se for uma mensagem de texto, cria a mensagem dentro do padrão de texto
		if (element['type'] == "TEXT") {
			const msgContent = document.createElement('div');
			msgContent.innerText = element['content'];
			
			const msgTime = document.createElement('span');
			msgTime.classList.add('message-time');
			if (is_group && element['sender_id'] == user_data['id']) {msgTime.innerText = formatTime(element['sent_at'])}
			else if (is_group && element['sender_id'] !== user_data['id'] ) {msgTime.innerText = element['author_name'] + ' - ' + formatTime(element['sent_at'])}
			else if (!is_group) {msgTime.innerText = formatTime(element['sent_at'])}

			msg.appendChild(msgContent);
        	msg.appendChild(msgTime);
		}

		// Se a mensagem for um arquivo, cria a mensagem dentro do padrão de arquivo
		else if (element['type'] == "BYTES"){
			const msg_attachment = document.createElement('div');
			msg_attachment.classList.add('message-attachment');
			
			const icon_type_archive = document.createElement('div');
			icon_type_archive.classList.add('icon-type-archive');
			if (element['type_archive'].includes("spreadsheet")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/xlsx.png')`;}
			else if (element['type_archive'].includes("pdf")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/pdf.png')`;}
			else if (element['type_archive'].includes("text")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/txt.png')`;}
			else if (element['type_archive'].includes("word")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/word.png')`;}
			else if (element['type_archive'].includes("zip")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/winrar.png')`;}
			else if (element['type_archive'].includes("image")) {icon_type_archive.style.backgroundImage = `url('${ip_server}/static/images/image.png')`;}

			const download_button = document.createElement('input');
			download_button.type = 'image';
			download_button.src = ip_server + '/static/images/download.png';
			download_button.classList.add('download-attachment');
			download_button.addEventListener('click', async () => {

			try {
				const response = await server(`download/${element['content']}`, { responseType: 'blob' })
				const url = window.URL.createObjectURL(response['data']);
				const a = document.createElement('a');
				a.href = url;
				a.download = element['content'];
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.log(error)
			}
				
			});

			const msgContent = document.createElement('div');
			msgContent.innerText = element['content'];
			
			const msgTime = document.createElement('span');
			msgTime.classList.add('message-time');
			if (is_group && element['sender_id'] == user_data['id']) {msgTime.innerText = formatTime(element['sent_at'])}
			else if (is_group && element['sender_id'] !== user_data['id'] ) {msgTime.innerText = element['author_name'] + ' - ' + formatTime(element['sent_at'])}
			else if (!is_group) {msgTime.innerText = formatTime(element['sent_at'])}

			msg_attachment.append(icon_type_archive);
			msg_attachment.append(msgContent);
			msg_attachment.append(download_button);
		
			msg.append(msg_attachment);
			msg.append(msgTime);
		}

		msg.addEventListener('dblclick', (event) => {
			event.preventDefault()
			showResponseDiv(msg);
		})
		msg.id = element['id']
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

