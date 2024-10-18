import { server } from '../js/server.js';

async function login() {
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

		if (status === 401) {
			document.getElementById('h2-erro-login').innerText = data.error;
			document.getElementById('overlay').style.visibility = 'visible';
		}
	}
};

function close() {
	document.getElementById('overlay').style.visibility = 'hidden';
};

document.getElementById('x-image').addEventListener('click', close)
document.getElementById('button-login').addEventListener('click', login);
document.getElementById('password').addEventListener('keypress', function (event) {
	if (event.key == 'Enter'){
		login()
	};
});
