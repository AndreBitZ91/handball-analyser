/**
 * HandballStatsDB - IndexedDB Data Access Layer
 * Gerencia todas as operações de base de dados para Handball Stats App
 * 
 * Estrutura:
 * - initDB(): Inicializa e configura a base de dados
 * - Operações CRUD genéricas e assíncronas
 * - Tratamento centralizado de erros
 * - Transações seguras
 */

const DB_NAME = 'HandballStatsDB';
const DB_VERSION = 1;

// Object stores e suas chaves
const STORES = {
  championships: { name: 'championships', keyPath: 'id', autoIncrement: true },
  teams: { name: 'teams', keyPath: 'id', autoIncrement: true },
  athletes: { name: 'athletes', keyPath: 'id', autoIncrement: true },
  games: { name: 'games', keyPath: 'id', autoIncrement: true },
  videos: { name: 'videos', keyPath: 'id', autoIncrement: true },
};

// Referência global da base de dados
let db = null;

/**
 * Inicializa a IndexedDB
 * Cria object stores se não existirem
 * 
 * @returns {Promise<IDBDatabase>} Instância da base de dados
 * @throws {Error} Se falhar ao abrir ou criar a BD
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Erro ao abrir
    request.onerror = () => {
      console.error('❌ Erro ao abrir IndexedDB:', request.error);
      reject(new Error(`Falha ao abrir ${DB_NAME}: ${request.error.message}`));
    };

    // Sucesso ao abrir
    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB inicializado com sucesso:', DB_NAME);
      resolve(db);
    };

    // Upgrade necessário (primeira vez ou mudança de versão)
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      console.log('🔧 Executando upgrade do schema...');

      try {
        // Criar object stores
        Object.values(STORES).forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
            });
            console.log(`📦 Object Store criado: ${store.name}`);
          }
        });

        console.log('✅ Upgrade completo. Stores criadas:', Array.from(db.objectStoreNames));
      } catch (error) {
        console.error('❌ Erro durante upgrade:', error);
        reject(new Error(`Erro no upgrade da BD: ${error.message}`));
      }
    };

    // Versão bloqueada (BD aberta em outro separador)
    request.onblocked = () => {
      console.warn('⚠️ Upgrade bloqueado. Feche outras abas com esta aplicação.');
    };
  });
}

/**
 * Valida se a store existe
 * @param {string} storeName - Nome da store
 * @throws {Error} Se store não existe
 */
function validateStore(storeName) {
  if (!STORES[storeName]) {
    throw new Error(`Store inválida: '${storeName}'. Stores válidas: ${Object.keys(STORES).join(', ')}`);
  }
  if (!db) {
    throw new Error('Base de dados não inicializada. Chame initDB() primeiro.');
  }
}

/**
 * Obtém uma transação pronta para operações
 * @param {string} storeName - Nome da store
 * @param {string} mode - 'readonly' ou 'readwrite'
 * @returns {IDBObjectStore} Object store com transação
 */
function getObjectStore(storeName, mode = 'readonly') {
  validateStore(storeName);
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

/**
 * Adiciona um novo registo a uma store
 * 
 * @param {string} storeName - Nome da store
 * @param {Object} data - Dados a adicionar (sem campo 'id', será auto-gerado)
 * @returns {Promise<number>} ID do registo criado
 * @throws {Error} Se falhar a operação
 */
async function addRecord(storeName, data) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      // Validar dados
      if (!data || typeof data !== 'object') {
        return reject(new Error('Dados inválidos. Deve ser um objecto.'));
      }

      const store = getObjectStore(storeName, 'readwrite');
      const request = store.add(data);

      request.onsuccess = () => {
        const newId = request.result;
        console.log(`✅ Registo adicionado em '${storeName}' com ID: ${newId}`);
        resolve(newId);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao adicionar em '${storeName}':`, request.error);
        reject(new Error(`Falha ao adicionar registo: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtém um registo pelo ID
 * 
 * @param {string} storeName - Nome da store
 * @param {number|string} id - ID do registo
 * @returns {Promise<Object|null>} Registo encontrado ou null
 * @throws {Error} Se falhar a operação
 */
async function getRecord(storeName, id) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      if (id === null || id === undefined) {
        return reject(new Error('ID inválido.'));
      }

      const store = getObjectStore(storeName, 'readonly');
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result;
        if (record) {
          console.log(`✅ Registo recuperado de '${storeName}' (ID: ${id})`);
        } else {
          console.warn(`⚠️ Nenhum registo encontrado em '${storeName}' (ID: ${id})`);
        }
        resolve(record || null);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao recuperar de '${storeName}':`, request.error);
        reject(new Error(`Falha ao recuperar registo: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Actualiza um registo existente
 * 
 * @param {string} storeName - Nome da store
 * @param {number|string} id - ID do registo
 * @param {Object} data - Novos dados (mescla com existentes)
 * @returns {Promise<Object>} Registo actualizado
 * @throws {Error} Se registo não existe ou falha na operação
 */
async function updateRecord(storeName, id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      validateStore(storeName);

      if (id === null || id === undefined) {
        return reject(new Error('ID inválido.'));
      }

      if (!data || typeof data !== 'object') {
        return reject(new Error('Dados inválidos. Deve ser um objecto.'));
      }

      // Obter registo existente
      const existingRecord = await getRecord(storeName, id);
      if (!existingRecord) {
        return reject(new Error(`Registo não encontrado (ID: ${id}).`));
      }

      // Mesclar dados
      const updatedRecord = { ...existingRecord, ...data, id };

      const store = getObjectStore(storeName, 'readwrite');
      const request = store.put(updatedRecord);

      request.onsuccess = () => {
        console.log(`✅ Registo actualizado em '${storeName}' (ID: ${id})`);
        resolve(updatedRecord);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao actualizar '${storeName}':`, request.error);
        reject(new Error(`Falha ao actualizar registo: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Elimina um registo
 * 
 * @param {storeName} storeName - Nome da store
 * @param {number|string} id - ID do registo
 * @returns {Promise<void>}
 * @throws {Error} Se falhar a operação
 */
async function deleteRecord(storeName, id) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      if (id === null || id === undefined) {
        return reject(new Error('ID inválido.'));
      }

      const store = getObjectStore(storeName, 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ Registo eliminado de '${storeName}' (ID: ${id})`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Erro ao eliminar em '${storeName}':`, request.error);
        reject(new Error(`Falha ao eliminar registo: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtém todos os registos de uma store
 * 
 * @param {string} storeName - Nome da store
 * @returns {Promise<Array>} Array de todos os registos
 * @throws {Error} Se falhar a operação
 */
async function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      const store = getObjectStore(storeName, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result;
        console.log(`✅ ${records.length} registo(s) recuperado(s) de '${storeName}'`);
        resolve(records);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao recuperar todos de '${storeName}':`, request.error);
        reject(new Error(`Falha ao recuperar registos: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * OPERAÇÕES AVANÇADAS
 */

/**
 * Conta registos numa store
 * 
 * @param {string} storeName - Nome da store
 * @returns {Promise<number>} Número total de registos
 */
async function countRecords(storeName) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      const store = getObjectStore(storeName, 'readonly');
      const request = store.count();

      request.onsuccess = () => {
        console.log(`📊 '${storeName}' tem ${request.result} registo(s)`);
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Falha ao contar registos: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Limpa todos os registos de uma store (CUIDADO!)
 * 
 * @param {string} storeName - Nome da store
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    try {
      validateStore(storeName);

      const store = getObjectStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => {
        console.warn(`🗑️  '${storeName}' foi completamente limpa`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Falha ao limpar store: ${request.error.message}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Apaga a base de dados completa (OPERAÇÃO IRREVERSÍVEL)
 * 
 * @returns {Promise<void>}
 */
async function deleteDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.warn(`🗑️  Base de dados '${DB_NAME}' foi apagada`);
      db = null;
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Falha ao apagar base de dados: ${request.error.message}`));
    };
  });
}

/**
 * Exporta dados de uma store como JSON
 * 
 * @param {string} storeName - Nome da store
 * @returns {Promise<string>} JSON dos dados
 */
async function exportStoreAsJSON(storeName) {
  try {
    const records = await getAllRecords(storeName);
    return JSON.stringify(records, null, 2);
  } catch (error) {
    throw new Error(`Falha ao exportar '${storeName}': ${error.message}`);
  }
}

/**
 * Importa dados para uma store a partir de JSON
 * NOTA: Limpa a store antes de importar
 * 
 * @param {string} storeName - Nome da store
 * @param {string} jsonString - String JSON com dados
 * @returns {Promise<number>} Número de registos importados
 */
async function importStoreFromJSON(storeName, jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!Array.isArray(data)) {
      throw new Error('JSON deve ser um array de objectos.');
    }

    await clearStore(storeName);

    let count = 0;
    for (const record of data) {
      await addRecord(storeName, record);
      count++;
    }

    console.log(`✅ ${count} registo(s) importado(s) em '${storeName}'`);
    return count;
  } catch (error) {
    throw new Error(`Falha ao importar em '${storeName}': ${error.message}`);
  }
}

/**
 * Obtém informações sobre a base de dados
 * 
 * @returns {Promise<Object>} Estatísticas da BD
 */
async function getDatabaseStats() {
  try {
    const stats = {};

    for (const storeName of Object.keys(STORES)) {
      stats[storeName] = await countRecords(storeName);
    }

    console.log('📈 Estatísticas da BD:', stats);
    return stats;
  } catch (error) {
    throw new Error(`Falha ao obter estatísticas: ${error.message}`);
  }
}

/**
 * EXPORTS para utilização em aplicação
 * Se usar módulos ES6, remova os comentários abaixo:
 */

// export {
//   initDB,
//   addRecord,
//   getRecord,
//   updateRecord,
//   deleteRecord,
//   getAllRecords,
//   countRecords,
//   clearStore,
//   deleteDatabase,
//   exportStoreAsJSON,
//   importStoreFromJSON,
//   getDatabaseStats,
// };

