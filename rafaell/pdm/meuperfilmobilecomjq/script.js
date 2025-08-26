// O evento 'pagecreate' é a forma recomendada pelo jQuery Mobile para executar código
// assim que uma página é criada e inicializada no DOM.
$(document).on('pagecreate', '#profile-page', function() {

    // 1. Exibe a mensagem de boas-vindas
    alert('Bem-vindo à versão jQuery Mobile!');

    // 2. Lógica para alternar o tema
    const themeToggleButton = $('#theme-toggle');
    const body = $('body'); // <<< MUDANÇA AQUI: seleciona o body

    // Adiciona um evento de clique ao botão
    themeToggleButton.on('click', function(event) {
        // Previne o comportamento padrão do link (que é navegar para '#')
        event.preventDefault();

        // Alterna a classe 'dark-theme' no elemento BODY.
        // Isso garante que a mudança afete a página inteira.
        body.toggleClass('dark-theme');
    });

});
