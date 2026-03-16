/**
 * App Controller
 * Ponto de entrada da aplicação
 * Inicializa BD, UI e listeners globais
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Inicializando Handball Stats App...');

    // 1. Inicializar Base de Dados
    await initDB();
    console.log('✅ Base de dados inicializada');

    // 2. Configurar listeners de tabs (do navigation.js já carregado)
    setupTabListeners();

    // 3. Setup de listeners globais
    setupGlobalListeners();

    console.log('🎯 Aplicação pronta!');

    // Opcional: Descomente para testes
    // await testDatabase();
  } catch (error) {
    console.error('🔥 Erro crítico ao inicializar:', error);
    showAlert('Erro ao inicializar aplicação. Recarregue a página.', 'error', 0);
  }
});

/**
 * Configura listeners para troca de tabs
 */
function setupTabListeners() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');

      // Remove active class from all tabs and contents
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
        console.log(`📍 Tab alterada para: ${tabId}`);
      }
    });
  });

  console.log('✅ Listeners de tabs configurados');
}

/**
 * Configura listeners globais da aplicação
 */
function setupGlobalListeners() {
  // ESC para fechar modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Modais já têm suporte para ESC
      console.log('⌨️  Tecla ESC pressionada');
    }
  });

  // Prevenir envios acidentais de formulários
  document.addEventListener('submit', (e) => {
    if (e.target.tagName === 'FORM' && !e.target.dataset.allowSubmit) {
      e.preventDefault();
      console.warn('⚠️  Envio de formulário bloqueado. Use createModal() em vez disso.');
    }
  });

  console.log('✅ Listeners globais configurados');
}

/**
 * Função de teste (OPCIONAL)
 * Descomente em setupTabListeners() para testar
 */
async function testDatabase() {
  try {
    console.log('\n🧪 Iniciando testes de BD...\n');

    // 1. Adicionar campeonato
    const champId = await addRecord('championships', {
      name: 'Campeonato Nacional 2026',
      season: 2026,
      startDate: '2026-01-15',
      endDate: '2026-06-30',
      status: 'active',
    });
    console.log('✅ Novo campeonato ID:', champId);
    showAlert('Campeonato criado com sucesso!', 'success');

    // 2. Adicionar equipa
    const teamId = await addRecord('teams', {
      name: 'SL Benfica',
      city: 'Lisboa',
      founded: 1904,
      coach: 'João Silva',
      championship_id: champId,
    });
    console.log('✅ Nova equipa ID:', teamId);

    // 3. Adicionar atleta
    const athleteId = await addRecord('athletes', {
      name: 'Paulo Santos',
      position: 'Pivot',
      number: 7,
      team_id: teamId,
      height: 200,
      weight: 95,
      nationality: 'PT',
    });
    console.log('✅ Novo atleta ID:', athleteId);

    // 4. Obter um registo
    const athlete = await getRecord('athletes', athleteId);
    console.log('✅ Atleta recuperado:', athlete);

    // 5. Actualizar registo
    const updated = await updateRecord('athletes', athleteId, {
      number: 8,
      weight: 96,
    });
    console.log('✅ Atleta actualizado:', updated);

    // 6. Contar registos
    const count = await countRecords('athletes');
    console.log(`✅ Total de atletas: ${count}`);

    // 7. Obter todos de uma store
    const allTeams = await getAllRecords('teams');
    console.log('✅ Todas as equipas:', allTeams);

    // 8. Estatísticas gerais
    await getDatabaseStats();

    console.log('\n✅ Todos os testes completados com sucesso!\n');
    showAlert('Testes completados com sucesso!', 'success');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    showAlert(`Erro nos testes: ${error.message}`, 'error');
  }
}

/**
 * Exemplo de uso de modal (descomente para testar)
 */
async function exampleModalUsage() {
  const result = await createModal(
    'Criar Novo Atleta',
    `
      <form>
        <div class="form-group">
          <label for="name">Nome</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div class="form-group">
          <label for="position">Posição</label>
          <select id="position" name="position" required>
            <option value="">Seleccione...</option>
            <option value="Guarda-redes">Guarda-redes</option>
            <option value="Defesa">Defesa</option>
            <option value="Pivot">Pivot</option>
            <option value="Ala">Ala</option>
          </select>
        </div>
        <div class="form-group">
          <label for="number">Número</label>
          <input type="number" id="number" name="number" min="1" max="99" required />
        </div>
      </form>
    `,
    async (formData) => {
      console.log('Dados do formulário:', formData);
      const athleteId = await addRecord('athletes', formData);
      showAlert(`Atleta criado com ID: ${athleteId}`, 'success');
      return athleteId;
    }
  );

  console.log('Resultado do modal:', result);
}
