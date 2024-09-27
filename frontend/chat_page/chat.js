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

/* Foto dinamica */

document.addEventListener("DOMContentLoaded", async(event) => { 
    const foto_user = document.getElementById('foto-usuario');
    foto_user.src = "https://github.com/FelippeRibeiro.png"

    const lista = document.getElementById('ul-teste');

    for (let index = 0; index < 20; index++) {
        const li = document.createElement('li')
        li.innerText = index
        lista.appendChild(li)
    }

    
});

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
