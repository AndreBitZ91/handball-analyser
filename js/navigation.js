/**
 * Navigation Controller
 * Gerencia a mudança de abas e inicialização da aplicação
 */

const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

// Event listeners para tabs
navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');

    // Remove active class from all tabs and contents
    navTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  });
});

// Inicializar BD quando página carrega
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    console.log('🎯 Handball Stats App pronta!');
    
    // Opcional: Descomente a linha abaixo para testar as funções
    // await testDatabase();
  } catch (error) {
    console.error('🔥 Erro crítico ao inicializar:', error);
  }
});

/**
 * Função de teste (OPCIONAL)
 * Descomente a linha acima para testar
 */
async function testDatabase() {
  try {
    console.log('\n🧪 Iniciando testes de
