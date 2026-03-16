/**
 * Championships Module
 * Gerencia todas as operações CRUD para campeonatos
 */

/**
 * Inicializa o módulo de campeonatos
 * Configuração de listeners e renderização inicial
 */
function initChampionships() {
  console.log('🏆 Inicializando módulo de Campeonatos...');
  
  // Renderizar campeonatos ao carregar
  renderChampionships();
  
  // Configurar listeners
  setupChampionshipsListeners();
  
  console.log('✅ Módulo de Campeonatos inicializado');
}

/**
 * Renderiza todos os campeonatos no tab
 * Obtém dados do IndexedDB e exibe em cartões/tabela
 */
async function renderChampionships() {
  try {
    // Obter container do tab
    const container = document.getElementById('championships-content');
    
    if (!container) {
      console.warn('⚠️ Container de campeonatos não encontrado');
      return;
    }

    // Mostrar loading
    const closeLoading = showLoading('Carregando campeonatos...');

    // Obter todos os campeonatos do IndexedDB
    const championships = await getAllRecords('championships');
    closeLoading();

    // Limpar container
    container.innerHTML = '';

    if (championships.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhum campeonato registado.</p>
          <button id="btn-add-championship-empty" class="btn btn-primary">
            + Criar Primeiro Campeonato
          </button>
        </div>
      `;
      
      // Listener para botão de criar
      document.getElementById('btn-add-championship-empty')?.addEventListener('click', () => {
        showChampionshipForm();
      });
      
      return;
    }

    // Criar HTML dos campeonatos
    const championsshipsHTML = championships.map(championship => `
      <div class="championship-card" data-id="${championship.id}">
        <div class="championship-header">
          <h3 class="championship-name">${championship.name || 'Sem nome'}</h3>
          <div class="championship-badge">${championship.status || 'inactivo'}</div>
        </div>
        
        <div class="championship-details">
          <div class="detail-row">
            <span class="label">Época:</span>
            <span class="value">${championship.season || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Início:</span>
            <span class="value">${championship.startDate ? formatDate(championship.startDate) : '—'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fim:</span>
            <span class="value">${championship.endDate ? formatDate(championship.endDate) : '—'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Descrição:</span>
            <span class="value">${championship.description || '—'}</span>
          </div>
        </div>
        
        <div class="championship-actions">
          <button class="btn btn-edit" data-id="${championship.id}" title="Editar campeonato">
            ✏️ Editar
          </button>
          <button class="btn btn-delete" data-id="${championship.id}" title="Remover campeonato">
            🗑️ Remover
          </button>
        </div>
      </div>
    `).join('');

    // Inserir HTML no container
    container.innerHTML = `
      <div class="championships-grid">
        ${championsshipsHTML}
      </div>
    `;

    // Configurar listeners dos botões de ação
    setupChampionshipCardListeners();

    console.log(`✅ ${championships.length} campeonato(s) renderizado(s)`);
  } catch (error) {
    console.error('❌ Erro ao renderizar campeonatos:', error);
    showAlert('Erro ao carregar campeonatos. Tente novamente.', 'error');
  }
}

/**
 * Configura listeners para botões de ação dos cartões
 */
function setupChampionshipCardListeners() {
  // Botões de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const championshipId = parseInt(btn.getAttribute('data-id'));
      
      try {
        const championship = await getRecord('championships', championshipId);
        if (championship) {
          showChampionshipForm(championship);
        } else {
          showAlert('Campeonato não encontrado.', 'error');
        }
      } catch (error) {
        console.error('❌ Erro ao obter campeonato:', error);
        showAlert('Erro ao editar campeonato.', 'error');
      }
    });
  });

  // Botões de remover
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const championshipId = parseInt(btn.getAttribute('data-id'));
      
      const confirmed = await showConfirm(
        'Remover Campeonato',
        'Tem a certeza que deseja remover este campeonato? Esta acção é irreversível.',
        'Remover',
        'Cancelar'
      );

      if (confirmed) {
        try {
          await deleteRecord('championships', championshipId);
          showAlert('Campeonato removido com sucesso!', 'success');
          renderChampionships();
        } catch (error) {
          console.error('❌ Erro ao remover campeonato:', error);
          showAlert('Erro ao remover campeonato.', 'error');
        }
      }
    });
  });
}

/**
 * Mostra formulário modal para adicionar/editar campeonato
 * 
 * @param {Object} championship - Campeonato para editar (null para adicionar novo)
 */
async function showChampionshipForm(championship = null) {
  const isEditing = championship !== null && championship.id;
  const title = isEditing ? 'Editar Campeonato' : 'Criar Novo Campeonato';

  const formHTML = `
    <form id="championship-form">
      <div class="form-group">
        <label for="championship-name">Nome do Campeonato *</label>
        <input 
          type="text" 
          id="championship-name" 
          name="name" 
          placeholder="ex: Campeonato Nacional 2026"
          value="${championship?.name || ''}"
          required 
        />
      </div>

      <div class="form-group">
        <label for="championship-season">Época/Temporada</label>
        <input 
          type="number" 
          id="championship-season" 
          name="season" 
          placeholder="ex: 2026"
          value="${championship?.season || ''}"
          min="2020"
          max="2100"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="championship-start">Data de Início</label>
          <input 
            type="date" 
            id="championship-start" 
            name="startDate" 
            value="${championship?.startDate || ''}"
          />
        </div>
        <div class="form-group">
          <label for="championship-end">Data de Fim</label>
          <input 
            type="date" 
            id="championship-end" 
            name="endDate" 
            value="${championship?.endDate || ''}"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="championship-status">Estado</label>
        <select id="championship-status" name="status">
          <option value="activo" ${championship?.status === 'activo' ? 'selected' : ''}>
            Activo
          </option>
          <option value="inactivo" ${championship?.status === 'inactivo' ? 'selected' : ''}>
            Inactivo
          </option>
          <option value="finalizado" ${championship?.status === 'finalizado' ? 'selected' : ''}>
            Finalizado
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="championship-description">Descrição</label>
        <textarea 
          id="championship-description" 
          name="description" 
          placeholder="Notas adicionais sobre o campeonato..."
          rows="4"
        >${championship?.description || ''}</textarea>
      </div>
    </form>
  `;

  // Callback para salvar
  const saveCallback = async (formData) => {
    try {
      // Validar dados obrigatórios
      if (!formData.name || formData.name.trim() === '') {
        showAlert('Nome do campeonato é obrigatório.', 'error');
        return null;
      }

      // Converter season para número
      if (formData.season) {
        formData.season = parseInt(formData.season);
      }

      let result;
      if (isEditing) {
        // Actualizar campeonato existente
        result = await updateRecord('championships', championship.id, formData);
        showAlert('Campeonato actualizado com sucesso!', 'success');
        console.log('✅ Campeonato actualizado:', result);
      } else {
        // Adicionar novo campeonato
        const newId = await addRecord('championships', formData);
        result = { ...formData, id: newId };
        showAlert('Campeonato criado com sucesso!', 'success');
        console.log('✅ Campeonato criado com ID:', newId);
      }

      // Renderizar lista actualizada
      renderChampionships();
      return result;
    } catch (error) {
      console.error('❌ Erro ao salvar campeonato:', error);
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
function setupChampionshipsListeners() {
  // Botão "Adicionar Campeonato" - se existir
  const addBtn = document.getElementById('btn-add-championship');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showChampionshipForm();
    });
  }
}

/**
 * Utilitários
 */

/**
 * Formata data para formato português (DD/MM/YYYY)
 * 
 * @param {string} dateString - Data em formato ISO (YYYY-MM-DD)
 * @returns {string} Data formatada
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Exporta dados de campeonatos
 * 
 * @returns {Promise<string>} JSON dos campeonatos
 */
async function exportChampionships() {
  try {
    const json = await exportStoreAsJSON('championships');
    downloadFile(json, 'campeonatos-export.json');
    showAlert('Campeonatos exportados com sucesso!', 'success');
    return json;
  } catch (error) {
    console.error('❌ Erro ao exportar campeonatos:', error);
    showAlert('Erro ao exportar campeonatos.', 'error');
  }
}

/**
 * Importa dados de campeonatos
 * 
 * @param {File} file - Ficheiro JSON
 */
async function importChampionships(file) {
  try {
    const json = await file.text();
    const count = await importStoreFromJSON('championships', json);
    showAlert(`${count} campeonato(s) importado(s) com sucesso!`, 'success');
    renderChampionships();
  } catch (error) {
    console.error('❌ Erro ao importar campeonatos:', error);
    showAlert('Erro ao importar campeonatos. Verifique o formato do ficheiro.', 'error');
  }
}

/**
 * Faz download de um ficheiro
 * 
 * @param {string} content - Conteúdo do ficheiro
 * @param {string} filename - Nome do ficheiro
 */
function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
