
function login(){
// Obtém os valores dos campos de entrada
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;

// Simula uma validação simples
if (username === "admin" && password === "1234") {
    window.location.href = "../chat_page/chat.html";
} else {
    window.alert('Login e/ou senha incorretos!');
};
};  

document.getElementById("button-login").addEventListener("click", login);