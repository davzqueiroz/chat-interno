# chat-interno
## Chat Interno desenvolvido na empresa Parcol Parafusos.

Backend construído com Python utilizando o framework Flask para criação de um servidor web.

Frontend construído com HTML + CSS + Javascript para fazer a interface do chat e consultas ao backend.

Para utilização do chat basta atualizar a constante nos arquivos chat.js e server.js nos respectivos caminhos:

  - static/js/chat.js:

      Linha 3: const ip_server = 'http://seu_ip_aqui:5000/'

  - static/js/server.js:

      Linha 1: baseURL: 'http://seu_ip_aqui:5000/'

Não é necessário mudar o IP do servidor backend, ele inicia com o IP da máquina.
Caso deseje mudar a porta do servidor, mude as portas no frontend citadas nos IPs acima e para mudar no servidor siga o caminho abaixo:

  - app.py:

      Linha 266: (local_ip, porta_desejada_aqui)


## Após essas alterações, basta rodar o server.bat ou iniciar o app.py com a IDE que desejar.
