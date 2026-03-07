import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'mysql-af6df01-scolarion.d.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_HK0OfgFA7axftHzKGxH',
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT || '23990'),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 10,
  charset: 'utf8mb4',
  timezone: '+00:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false
  }
};

let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Pool de connexions MySQL créé avec succès');
} catch (error) {
  console.error('❌ Erreur création pool MySQL:', error);
  throw error;
}

function cleanParams(params: any[]): any[] {
  return params.map(param => param === undefined ? null : param);
}

// ✅ FONCTION QUERY CORRIGÉE
export async function query(sql: string, params: any[] = []) {
  console.log('📝 SQL:', sql);
  console.log('🔧 Paramètres:', params);
  
  let connection;
  try {
    connection = await pool.getConnection();
    const cleanedParams = cleanParams(params);
    
    const [result] = await connection.query(sql, cleanedParams);
    
    console.log('✅ Type de résultat:', result ? typeof result : 'undefined');
    console.log('✅ Est un tableau?', Array.isArray(result));
    
    // ✅ RETOURNER LE RÉSULTAT COMPLET, PAS SEULEMENT LES LIGNES
    return result;
    
  } catch (error: any) {
    console.error('❌ ERREUR SQL DÉTAILLÉE:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   SQL:', sql);
    console.error('   Params:', cleanParams(params));
    console.error('   Stack:', error.stack);
    
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('✅ Connexion libérée');
      } catch (releaseError) {
        console.error('❌ Erreur lors de la libération:', releaseError);
      }
    }
  }
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
    insertId: result.insertId,
    affectedRows: result.affectedRows,
    success: !!result.insertId
  };
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

export default pool;