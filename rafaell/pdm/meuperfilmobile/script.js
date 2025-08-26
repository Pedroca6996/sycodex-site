// Este evento é acionado assim que todo o conteúdo HTML da página é carregado.
document.addEventListener('DOMContentLoaded', () => {

    // Exibe uma mensagem de boas-vindas ao usuário.
    alert('Bem-vindo ao Meu Perfil Mobile!');

    // Seleciona o botão de alternar tema pelo seu ID.
    const themeToggleButton = document.getElementById('theme-toggle');
    
    // Seleciona o elemento body do documento.
    const body = document.body;

    // Adiciona um "ouvinte de evento" ao botão. A função dentro dele será executada sempre que o botão for clicado.
    themeToggleButton.addEventListener('click', () => {
        // O método 'toggle' adiciona a classe 'dark-theme' se ela não existir no body,
        // e a remove se ela já existir. Isso alterna o tema da página.
        body.classList.toggle('dark-theme');
    });

});
