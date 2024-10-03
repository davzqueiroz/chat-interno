
async function login(){
// Obtém os valores dos campos de entrada
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;

try {
    const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        body: JSON.stringify({
            email: username,
            senha: password
        }),
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Usuário ou senha incorretos.');
        }
        throw new Error(`Erro ao fazer login: ${response.status}`);
    }
    
    const data = await response.json();   
    const token = data['token']; 
    
    if (token) {
        localStorage.setItem('authToken', token);
        window.location.href = "../chat_page/chat.html";
    }

} catch (error) {
    console.error('Erro:', error);
    alert(error.message);
}

};

document.getElementById("button-login").addEventListener("click", login);