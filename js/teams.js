/**
 * Teams Module
 * Gerencia todas as operações CRUD para equipas
 */

/**
 * Inicializa o módulo de equipas
 * Configuração de listeners e renderização inicial
 */
function initTeams() {
  console.log('⚽ Inicializando módulo de Equipas...');
  
  // Renderizar equipas ao carregar
  renderTeams();
  
  // Configurar listeners
  setupTeamsListeners();
  
  console.log('✅ Módulo de Equipas inicializado');
}

/**
 * Renderiza todas as equipas no tab
 * Obtém dados do IndexedDB e exibe em cartões
 */
async function renderTeams() {
  try {
    // Obter container do tab
    const container = document.getElementById('teams-content');
    
    if (!container) {
      console.warn('⚠️ Container de equipas não encontrado');
      return;
    }

    // Mostrar loading
    const closeLoading = showLoading('Carregando equipas...');

    // Obter todas as equipas do IndexedDB
    const teams = await getAllRecords('teams');
    closeLoading();

    // Limpar container
    container.innerHTML = '';

    if (teams.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma equipa registada.</p>
          <button id="btn-add-team-empty" class="btn btn-primary">
            + Criar Primeira Equipa
          </button>
        </div>
      `;
      
      // Listener para botão de criar
      document.getElementById('btn-add-team-empty')?.addEventListener('click', () => {
        showTeamForm();
      });
      
      return;
    }

    // Criar HTML das equipas
    const teamsHTML = teams.map(team => `
      <div class="team-card" data-id="${team.id}">
        <div class="team-header">
          <h3 class="team-name">${team.name || 'Sem nome'}</h3>
          <div class="team-city">${team.city || '—'}</div>
        </div>
        
        <div class="team-details">
          <div class="detail-row">
            <span class="label">Fundada:</span>
            <span class="value">${team.founded || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Treinador:</span>
            <span class="value">${team.coach || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Campeonato:</span>
            <span class="value">${team.championship_id ? `ID: ${team.championship_id}` : '—'}</span>
          </div>
          ${team.stadium ? `
            <div class="detail-row">
              <span class="label">Estádio:</span>
              <span class="value">${team.stadium}</span>
            </div>
          ` : ''}
          ${team.description ? `
            <div class="detail-row">
              <span class="label">Descrição:</span>
              <span class="value">${team.description}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="team-actions">
          <button class="btn btn-edit" data-id="${team.id}" title="Editar equipa">
            ✏️ Editar
          </button>
          <button class="btn btn-delete" data-id="${team.id}" title="Remover equipa">
            🗑️ Remover
          </button>
        </div>
      </div>
    `).join('');

    // Inserir HTML no container
    container.innerHTML = `
      <div class="teams-grid">
        ${teamsHTML}
      </div>
    `;

    // Configurar listeners dos botões de ação
    setupTeamCardListeners();

    console.log(`✅ ${teams.length} equipa(s) renderizada(s)`);
  } catch (error) {
    console.error('❌ Erro ao renderizar equipas:', error);
    showAlert('Erro ao carregar equipas. Tente novamente.', 'error');
  }
}

/**
 * Configura listeners para botões de ação dos cartões
 */
function setupTeamCardListeners() {
  // Botões de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const teamId = parseInt(btn.getAttribute('data-id'));
      
      try {
        const team = await getRecord('teams', teamId);
        if (team) {
          showTeamForm(team);
        } else {
          showAlert('Equipa não encontrada.', 'error');
        }
      } catch (error) {
        console.error('❌ Erro ao obter equipa:', error);
        showAlert('Erro ao editar equipa.', 'error');
      }
    });
  });

  // Botões de remover
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const teamId = parseInt(btn.getAttribute('data-id'));
      
      const confirmed = await showConfirm(
        'Remover Equipa',
        'Tem a certeza que deseja remover esta equipa? Esta acção é irreversível.',
        'Remover',
        'Cancelar'
      );

      if (confirmed) {
        try {
          await deleteRecord('teams', teamId);
          showAlert('Equipa removida com sucesso!', 'success');
          renderTeams();
        } catch (error) {
          console.error('❌ Erro ao remover equipa:', error);
          showAlert('Erro ao remover equipa.', 'error');
        }
      }
    });
  });
}

/**
 * Mostra formulário modal para adicionar/editar equipa
 * 
 * @param {Object} team - Equipa para editar (null para adicionar nova)
 */
async function showTeamForm(team = null) {
  const isEditing = team !== null && team.id;
  const title = isEditing ? 'Editar Equipa' : 'Criar Nova Equipa';

  const formHTML = `
    <form id="team-form">
      <div class="form-group">
        <label for="team-name">Nome da Equipa *</label>
        <input 
          type="text" 
          id="team-name" 
          name="name" 
          placeholder="ex: SL Benfica"
          value="${team?.name || ''}"
          required 
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="team-city">Cidade *</label>
          <input 
            type="text" 
            id="team-city" 
            name="city" 
            placeholder="ex: Lisboa"
            value="${team?.city || ''}"
            required 
          />
        </div>
        <div class="form-group">
          <label for="team-founded">Ano de Fundação</label>
          <input 
            type="number" 
            id="team-founded" 
            name="founded" 
            placeholder="ex: 1904"
            value="${team?.founded || ''}"
            min="1800"
            max="2100"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="team-coach">Treinador</label>
        <input 
          type="text" 
          id="team-coach" 
          name="coach" 
          placeholder="ex: João Silva"
          value="${team?.coach || ''}"
        />
      </div>

      <div class="form-group">
        <label for="team-stadium">Estádio/Pavilhão</label>
        <input 
          type="text" 
          id="team-stadium" 
          name="stadium" 
          placeholder="ex: Pavilhão João Rocha"
          value="${team?.stadium || ''}"
        />
      </div>

      <div class="form-group">
        <label for="team-championship">ID do Campeonato</label>
        <input 
          type="number" 
          id="team-championship" 
          name="championship_id" 
          placeholder="ex: 1"
          value="${team?.championship_id || ''}"
          min="1"
        />
      </div>

      <div class="form-group">
        <label for="team-description">Descrição</label>
        <textarea 
          id="team-description" 
          name="description" 
          placeholder="Notas adicionais sobre a equipa..."
          rows="4"
        >${team?.description || ''}</textarea>
      </div>
    </form>
  `;

  // Callback para salvar
  const saveCallback = async (formData) => {
    try {
      // Validar dados obrigatórios
      if (!formData.name || formData.name.trim() === '') {
        showAlert('Nome da equipa é obrigatório.', 'error');
        return null;
      }

      if (!formData.city || formData.city.trim() === '') {
        showAlert('Cidade é obrigatória.', 'error');
        return null;
      }

      // Converter para números quando apropriado
      if (formData.founded) {
        formData.founded = parseInt(formData.founded);
      }
      if (formData.championship_id) {
        formData.championship_id = parseInt(formData.championship_id);
      }

      let result;
      if (isEditing) {
        // Actualizar equipa existente
        result = await updateRecord('teams', team.id, formData);
        showAlert('Equipa actualizada com sucesso!', 'success');
        console.log('✅ Equipa actualizada:', result);
      } else {
        // Adicionar nova equipa
        const newId = await addRecord('teams', formData);
        result = { ...formData, id: newId };
        showAlert('Equipa criada com sucesso!', 'success');
        console.log('✅ Equipa criada com ID:', newId);
      }

      // Renderizar lista actualizada
      renderTeams();
      return result;
    } catch (error) {
      console.error('❌ Erro ao salvar equipa:', error);
      showAlert(`Erro ao salvar: ${error.message}`, 'error');
      return null;
    }
  };

  // Mostrar modal
  await createModal(
    title,
    formHTML,
    saveCallback,
    {
      saveButtonText: isEditing ? 'Actualizar' : 'Criar',
      cancelButtonText: 'Cancelar',
    }
  );
}

/**
 * Configura listeners iniciais de botões de ação
 */
function setupTeamsListeners() {
  // Botão "Adicionar Equipa" - se existir
  const addBtn = document.getElementById('btn-add-team');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showTeamForm();
    });
  }
}

/**
 * Utilitários
 */

/**
 * Exporta dados de equipas
 * 
 * @returns {Promise<string>} JSON das equipas
 */
async function exportTeams() {
  try {
    const json = await exportStoreAsJSON('teams');
    downloadFile(json, 'equipas-export.json');
    showAlert('Equipas exportadas com sucesso!', 'success');
    return json;
  } catch (error) {
    console.error('❌ Erro ao exportar equipas:', error);
    showAlert('Erro ao exportar equipas.', 'error');
  }
}

/**
 * Importa dados de equipas
 * 
 * @param {File} file - Ficheiro JSON
 */
async function importTeams(file) {
  try {
    const json = await file.text();
    const count = await importStoreFromJSON('teams', json);
    showAlert(`${count} equipa(s) importada(s) com sucesso!`, 'success');
    renderTeams();
  } catch (error) {
    console.error('❌ Erro ao importar equipas:', error);
    showAlert('Erro ao importar equipas. Verifique o formato do ficheiro.', 'error');
  }
}

/**
 * Procura equipas por nome
 * 
 * @param {string} query - Termo de pesquisa
 * @returns {Promise<Array>} Equipas encontradas
 */
async function searchTeams(query) {
  try {
    if (!query || query.trim() === '') {
      return await getAllRecords('teams');
    }

    const allTeams = await getAllRecords('teams');
    const queryLower = query.toLowerCase();
    
    return allTeams.filter(team => 
      team.name?.toLowerCase().includes(queryLower) ||
      team.city?.toLowerCase().includes(queryLower) ||
      team.coach?.toLowerCase().includes(queryLower)
    );
  } catch (error) {
    console.error('❌ Erro ao procurar equipas:', error);
    return [];
  }
}

/**
 * Obtém equipas por campeonato
 * 
 * @param {number} championshipId - ID do campeonato
 * @returns {Promise<Array>} Equipas do campeonato
 */
async function getTeamsByChampionship(championshipId) {
  try {
    const allTeams = await getAllRecords('teams');
    return allTeams.filter(team => team.championship_id === championshipId);
  } catch (error) {
    console.error('❌ Erro ao obter equipas do campeonato:', error);
    return [];
  }
}
