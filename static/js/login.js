import { server } from '../js/server.js';

async function login() {
	// Obtém os valores dos campos de entrada
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	if (password.length <= 0) return alert('Insira sua senha');
	if (username.length <= 0) return alert('Insira seu login');

	try {
		const request = await server.post('/login', {
			email: username,
			senha: password,
		});

		const response = request.data;
		const token = response['token'];
		if (token) {
			localStorage.setItem('authToken', token);
			window.location.href = '/chat';
		}
	} catch (error) {
		const {
			status,
			response: { data },
		} = error;

		if (status === 401) return alert(data.error);
	}
}

document.getElementById('button-login').addEventListener('click', login);
