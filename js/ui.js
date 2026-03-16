/**
 * UI Controller
 * Gerencia todas as interações da interface do utilizador
 * - Troca de tabs
 * - Modais genéricos
 * - Diálogos de confirmação
 */

/**
 * Cria e mostra um modal genérico
 * 
 * @param {string} title - Título do modal
 * @param {string} contentHtml - HTML do conteúdo
 * @param {Function} onSaveCallback - Callback ao clicar em "Salvar"
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} Dados do formulário se salvo, null se cancelado
 */
function createModal(title, contentHtml, onSaveCallback, options = {}) {
  return new Promise((resolve) => {
    const {
      saveButtonText = 'Salvar',
      cancelButtonText = 'Cancelar',
      showSaveButton = true,
    } = options;

    // Criar backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = `modal-backdrop-${Date.now()}`;

    // Criar modal container
    const modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.id = `modal-${Date.now()}`;

    // HTML do modal
    modal.innerHTML = `
      <div class="modal-dialog">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Fechar modal">&times;</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          ${contentHtml}
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancel" type="button">
            ${cancelButtonText}
          </button>
          ${showSaveButton ? `
            <button class="modal-btn modal-btn-save" type="button">
              ${saveButtonText}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Adicionar ao DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Injec tar estilos CSS do modal (se ainda não existirem)
    injectModalStyles();

    // Forçar reflow para activar animação
    setTimeout(() => {
      backdrop.classList.add('active');
      modal.classList.add('active');
    }, 10);

    // Referências de botões
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-btn-cancel');
    const saveBtn = modal.querySelector('.modal-btn-save');
    const form = modal.querySelector('form');

    /**
     * Fechar modal
     */
    function closeModal(result = null) {
      backdrop.classList.remove('active');
      modal.classList.remove('active');

      setTimeout(() => {
        backdrop.remove();
        modal.remove();
        resolve(result);
      }, 300);
    }

    /**
     * Extrair dados do formulário
     */
    function getFormData() {
      if (!form) return null;

      const formData = new FormData(form);
      const data = {};

      formData.forEach((value, key) => {
        if (data.hasOwnProperty(key)) {
          // Se a chave já existe, converter para array
          if (!Array.isArray(data[key])) {
            data[key] = [data[key]];
          }
          data[key].push(value);
        } else {
          data[key] = value;
        }
      });

      return data;
    }

    // Event listeners
    closeBtn.addEventListener('click', () => closeModal(null));
    cancelBtn.addEventListener('click', () => closeModal(null));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(null);
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          const formData = getFormData();

          // Chamar callback se existir
          if (onSaveCallback && typeof onSaveCallback === 'function') {
            const result = await onSaveCallback(formData);
            closeModal(result);
          } else {
            closeModal(formData);
          }
        } catch (error) {
          console.error('❌ Erro ao salvar modal:', error);
          showAlert('Erro ao processar dados. Tente novamente.', 'error');
        }
      });
    }

    // Fechar ao pressionar ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal(null);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    return resolve;
  });
}

/**
 * Injecta estilos CSS do modal no head
 */
function injectModalStyles() {
  const styleId = 'modal-styles';
  if (document.getElementById(styleId)) return; // Já existe

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      z-index: 999;
      transition: background 200ms ease;
    }

    .modal-backdrop.active {
      background: rgba(0, 0, 0, 0.5);
    }

    /* Modal Container */
    .modal-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      z-index: 1000;
      opacity: 0;
      transition: opacity 200ms ease, transform 200ms ease;
      pointer-events: none;
    }

    .modal-container.active {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      pointer-events: auto;
    }

    /* Modal Dialog */
    .modal-dialog {
      background: white;
      border: 2px solid #1a1a1a;
      border-radius: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    /* Modal Header */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
    }

    .modal-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1a1a1a;
      margin: 0;
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 2rem;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 200ms ease;
    }

    .modal-close:hover {
      color: #1a1a1a;
    }

    /* Modal Body */
    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    /* Modal Footer */
    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #ddd;
      background: #f5f5f5;
    }

    /* Modal Buttons */
    .modal-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #1a1a1a;
      background: transparent;
      color: #1a1a1a;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: all 200ms ease;
      border-radius: 0;
    }

    .modal-btn:hover {
      background: #1a1a1a;
      color: white;
    }

    .modal-btn-save {
      background: #FF6B35;
      border-color: #FF6B35;
      color: white;
    }

    .modal-btn-save:hover {
      background: #E55A25;
      border-color: #E55A25;
    }

    .modal-btn-cancel {
      background: white;
      border-color: #ddd;
      color: #666;
    }

    .modal-btn-cancel:hover {
      background: #f5f5f5;
      border-color: #1a1a1a;
      color: #1a1a1a;
    }

    /* Form Styling dentro do Modal */
    .modal-body form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1a1a1a;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      color: #1a1a1a;
      transition: border-color 200ms ease;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #FF6B35;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modal-dialog {
        max-width: 95%;
        width: 95%;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-footer {
        padding: 1rem;
        flex-direction: column-reverse;
      }

      .modal-btn {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}

/**
 * Mostra um alerta de notificação
 * 
 * @param {string} message - Mensagem a mostrar
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (0 = permanente)
 */
function showAlert(message, type = 'info', duration = 3000) {
  const alertId = `alert-${Date.now()}`;
  const alert = document.createElement('div');
  alert.id = alertId;
  alert.className = `alert alert-${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  alert.innerHTML = `
    <div class="alert-content">
      <span class="alert-icon">${icons[type] || ''}</span>
      <span class="alert-message">${message}</span>
      <button class="alert-close" aria-label="Fechar alerta">&times;</button>
    </div>
  `;

  injectAlertStyles();
  document.body.appendChild(alert);

  // Trigger animation
  setTimeout(() => alert.classList.add('active'), 10);

  // Close button
  alert.querySelector('.alert-close').addEventListener('click', () => {
    alert.classList.remove('active');
    setTimeout(() => alert.remove(), 300);
  });

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      alert.classList.remove('active');
      setTimeout(() => alert.remove(), 300);
    }, duration);
  }
}

/**
 * Injecta estilos CSS do alerta
 */
function injectAlertStyles() {
  const styleId = 'alert-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Alert Container */
    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 998;
      opacity: 0;
      transform: translateX(400px);
      transition: opacity 300ms ease, transform 300ms ease;
    }

    .alert.active {
      opacity: 1;
      transform: translateX(0);
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 0;
      border-left: 4px solid;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: 'Inter', sans-serif;
      min-width: 300px;
    }

    .alert-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .alert-message {
      flex: 1;
      font-size: 0.95rem;
      color: #1a1a1a;
    }

    .alert-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 200ms ease;
    }

    .alert-close:hover {
      color: #1a1a1a;
    }

    /* Alert Types */
    .alert-success .alert-content {
      border-left-color: #4CAF50;
      background: #f1f8f4;
    }

    .alert-error .alert-content {
      border-left-color: #f44336;
      background: #fef5f5;
    }

    .alert-warning .alert-content {
      border-left-color: #FF9800;
      background: #fff8f0;
    }

    .alert-info .alert-content {
      border-left-color: #2196F3;
      background: #f0f7ff;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .alert {
        top: 10px;
        right: 10px;
        left: 10px;
      }

      .alert-content {
        min-width: auto;
      }
    }
  `;

  document.head.appendChild(style);
}

/**
 * Mostra um diálogo de confirmação
 * 
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {string} confirmText - Texto do botão de confirmação
 * @param {string} cancelText - Texto do botão de cancelamento
 * @returns {Promise<boolean>} true se confirmado, false se cancelado
 */
function showConfirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  return new Promise((resolve) => {
    const html = `<p style="margin: 0; color: #666;">${message}</p>`;

    createModal(title, html, null, {
      saveButtonText: confirmText,
      cancelButtonText: cancelText,
      showSaveButton: true,
    }).then((result) => {
      resolve(result !== null);
    });
  });
}

/**
 * Mostra um diálogo de entrada de texto
 * 
 * @param {string} title - Título
 * @param {string} placeholder - Placeholder do input
 * @param {string} defaultValue - Valor por defeito
 * @returns {Promise<string|null>} Valor inserido ou null se cancelado
 */
function showPrompt(title, placeholder = '', defaultValue = '') {
  return new Promise((resolve) => {
    const html = `
      <form>
        <div class="form-group">
          <input 
            type="text" 
            name="value" 
            placeholder="${placeholder}" 
            value="${defaultValue}"
            autofocus
            style="width: 100%;"
          />
        </div>
      </form>
    `;

    createModal(title, html, (data) => {
      resolve(data?.value || null);
    }, {
      saveButtonText: 'OK',
      cancelButtonText: 'Cancelar',
    });
  });
}

/**
 * Mostra um spinner de carregamento
 * 
 * @param {string} message - Mensagem a mostrar
 * @returns {Function} Função para fechar o spinner
 */
function showLoading(message = 'Carregando...') {
  const loaderId = `loader-${Date.now()}`;
  const loader = document.createElement('div');
  loader.id = loaderId;
  loader.className = 'loader-overlay';

  loader.innerHTML = `
    <div class="loader-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;

  injectLoaderStyles();
  document.body.appendChild(loader);

  setTimeout(() => loader.classList.add('active'), 10);

  return () => {
    loader.classList.remove('active');
    setTimeout(() => loader.remove(), 300);
  };
}

/**
 * Injecta estilos CSS do loader
 */
function injectLoaderStyles() {
  const styleId = 'loader-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0);
      z-index: 997;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 300ms ease, background 300ms ease;
    }

    .loader-overlay.active {
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
    }

    .loader-content {
      text-align: center;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid #ddd;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loader-content p {
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      color: #1a1a1a;
      margin: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
}

