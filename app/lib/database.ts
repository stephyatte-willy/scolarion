import mysql from 'mysql2/promise';

// Configuration avec timeouts explicites
const dbConfig = {
  host: process.env.DB_HOST || 'mysql-af6df01-scolarion.d.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_HK0OfgFA7axftHzKGxH',
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT || '23990'),
  
  // Configuration du pool - plus robuste
  waitForConnections: true,
  connectionLimit: 5, // Réduit pour éviter la saturation
  queueLimit: 0, // Pas de limite de file d'attente
  maxIdle: 2, // Garde 2 connexions inactives max
  idleTimeout: 10000, // 10 secondes max pour une connexion inactive
  
  // Timeouts cruciaux pour éviter les ETIMEDOUT
  connectTimeout: 10000, // 10 secondes pour établir la connexion
  acquireTimeout: 10000, // 10 secondes pour obtenir une connexion du pool
  
  // Keep alive pour éviter les coupures
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // SSL
  ssl: {
    rejectUnauthorized: false
  }
};

let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
  
  // Test immédiat de la connexion
  pool.getConnection()
    .then(conn => {
      console.log('✅ Connexion test réussie');
      conn.release();
    })
    .catch(err => {
      console.error('❌ Échec du test de connexion:', err.message);
    });
    
  console.log('✅ Pool de connexions MySQL créé avec succès');
} catch (error) {
  console.error('❌ Erreur création pool MySQL:', error);
  throw error;
}

function cleanParams(params: any[]): any[] {
  return params.map(param => param === undefined ? null : param);
}

// ✅ FONCTION QUERY ULTRA-ROBUSTE
export async function query(sql: string, params: any[] = []) {
  console.log('📝 SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
  console.log('🔧 Paramètres:', params);
  
  let connection;
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      connection = await pool.getConnection();
      const cleanedParams = cleanParams(params);
      
      // ✅ Utiliser query() au lieu de execute() pour plus de compatibilité
      const [rows] = await connection.query(sql, cleanedParams);
      
      console.log('✅ Requête réussie');
      
      return rows;
      
    } catch (error: any) {
      console.error(`❌ Tentative ${retryCount + 1}/${maxRetries + 1} échouée:`);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      
      // Si c'est une erreur de connexion ETIMEDOUT, on réessaie
      if (error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`🔄 Nouvelle tentative dans 1 seconde... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      // Pour les autres erreurs, on log et on relance
      console.error('❌ ERREUR SQL DÉTAILLÉE:');
      console.error('   SQL:', sql);
      console.error('   Params:', cleanParams(params));
      console.error('   Stack:', error.stack);
      
      throw error;
      
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error('❌ Erreur lors de la libération:', releaseError);
        }
      }
    }
  }
  
  throw new Error('Échec après plusieurs tentatives');
}

// ✅ FONCTION SPÉCIALE POUR LES REQUÊTES SELECT
export async function queryRows(sql: string, params: any[] = []) {
  const result = await query(sql, params);
  return Array.isArray(result) ? result : [];
}

// ✅ FONCTION SPÉCIALE POUR LES INSERT/UPDATE
export async function queryInsert(sql: string, params: any[] = []) {
  const result = await query(sql, params) as any;
  return {
    insertId: result?.insertId || 0,
    affectedRows: result?.affectedRows || 0,
    success: !!(result?.insertId || result?.affectedRows)
  };
}

// ✅ FONCTION POUR VÉRIFIER LA SANTÉ DE LA CONNEXION
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as test');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('❌ Échec checkConnection:', error);
    return false;
  }
}

export async function transactionQuery(sql: string) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(sql);
    return rows;
  } catch (error) {
    console.error('❌ Erreur transaction:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Erreur libération transaction:', releaseError);
      }
    }
  }
}

export async function runTransaction(callback: (connection: mysql.PoolConnection) => Promise<any>) {
  const connection = await pool.getConnection();
  try {
    await connection.query('START TRANSACTION');
    const result = await callback(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Erreur libération transaction:', releaseError);
      }
    }
  }
}

// ✅ NETTOYAGE PÉRIODIQUE DU POOL (optionnel)
setInterval(() => {
  if (pool) {
    console.log('🔄 Nettoyage périodique du pool...');
    // MySQL2 gère automatiquement le nettoyage, mais on peut forcer un test
    checkConnection().then(ok => {
      if (ok) console.log('✅ Pool OK');
      else console.warn('⚠️ Pool可能需要检查');
    });
  }
}, 60000); // Vérifier toutes les minutes

export default pool;
export { pool }; 