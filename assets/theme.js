// Tema claro/escuro
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Verificar preferência salva ou do sistema
const savedTheme = localStorage.getItem('theme');
let currentTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');

// Aplicar tema no carregamento
function applyTheme(theme) {
    document.body.className = theme + '-mode';
    htmlElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
}

applyTheme(currentTheme);

// Alternar tema
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
});

// Sincronizar com mudanças do sistema
prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        currentTheme = e.matches ? 'dark' : 'light';
        applyTheme(currentTheme);
    }
});
