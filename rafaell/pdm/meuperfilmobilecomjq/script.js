// Executa quando a página é criada pelo jQuery Mobile
$(document).on('pagecreate', '#profile-page', function() {

    alert('Bem-vindo à versão jQuery Mobile!');

    // --- LÓGICA DE MUDANÇA DE TEMA ---

    // 1. Seleciona os elementos que vamos alterar
    const themeToggleButton = $('#theme-toggle');
    const page = $('#profile-page');
    const header = page.find('.ui-header');
    const footer = page.find('.ui-footer');
    const profilePic = $('.profile-pic');

    // 2. Variável para guardar o estado atual do tema
    let isDarkMode = false;

    // 3. Define as cores para cada tema
    const lightTheme = {
        bgColor: '#f9f9f9',
        textColor: '#333333',
        barColor: '#f6f6f6',
        barTextColor: '#333333',
        borderColor: '#dddddd',
        picBorderColor: '#3388cc'
    };

    const darkTheme = {
        bgColor: '#121212',
        textColor: '#e0e0e0',
        barColor: '#bb86fc', // Roxo
        barTextColor: '#ffffff', // Branco
        borderColor: '#bb86fc',
        picBorderColor: '#bb86fc'
    };

    // 4. Função que aplica os estilos
    function applyTheme(theme) {
        page.css({
            'background': theme.bgColor,
            'color': theme.textColor
        });
        header.css({
            'background': theme.barColor,
            'color': theme.barTextColor,
            'border-color': theme.borderColor,
            'text-shadow': 'none'
        });
        footer.css({
            'background': theme.barColor,
            'color': theme.barTextColor,
            'border-color': theme.borderColor,
            'text-shadow': 'none'
        });
        profilePic.css('border-color', theme.picBorderColor);
    }

    // 5. Evento de clique no botão
    themeToggleButton.on('click', function(event) {
        event.preventDefault();
        
        // Inverte o estado do tema
        isDarkMode = !isDarkMode;

        // Aplica o tema correto
        if (isDarkMode) {
            applyTheme(darkTheme);
        } else {
            applyTheme(lightTheme);
        }
    });
});
