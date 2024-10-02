/* Função para alterar entre contatos e configurações */

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

/* Função para inserir mensagens no HTML */

function insertMessageHTML() {
    const value_textbar = document.getElementById('input-message').value;    
    const mensagem = document.createElement('li')

    if (value_textbar.trim() !== '') {
    mensagem.innerText = value_textbar
    mensagem.classList.add('sended')

    document.getElementById('lista-mensagens').appendChild(mensagem)

    const messageContainer = document.querySelector('.messages-chat')
    messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    document.getElementById('input-message').value = '';
}

/* Evento pra enviar mensagem pressionando */

document.getElementById('input-message').addEventListener("keydown", function(event){
    if (event.key == 'Enter' && !event.shiftKey) {
        event.preventDefault()
        insertMessageHTML()
    }
});

/* Foto dinamica */

document.addEventListener("DOMContentLoaded", async(event) => { 
    const foto_user = document.getElementById('foto-usuario');
    foto_user.src = "https://github.com/davzqueiroz.png"
    
});

/* Contatos dinâmicos */

const lista = document.getElementById('lista-contatos');

async function get_contacts() {
    try {
        const response = await fetch('http://192.168.0.37:5000/get_contacts');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json()
        console.log(data)
        data['nomes'].forEach(element => {
            const contato = document.createElement('li')
            contato.innerText = element
            contato.addEventListener('click', function editContactName() {
                document.getElementById('nome-contato').innerText = element
                showMessages(element)
            })
            lista.appendChild(contato)
        });
    } catch (error) {
        console.log(error)
    }
}

get_contacts()

/* Mensagens dinâmicas */

async function showMessages(contactName) {
    try {
        const response = await fetch('http://192.168.0.37:5000/get_messages');
        if (!response.ok) {throw new Error('Network response was not ok')};
        const data = await response.json()
        data['content'].forEach(element => {
            /* Adicionar aqui dentro lógica para inserir mensagens no HTML*/
        });
    } catch (error) {
        console.log(error);
    }
}

/* ============================== PAINEL DE ANEXO =========================== */

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
