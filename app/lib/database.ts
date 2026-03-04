import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '91.216.107.196',  
  password: process.env.DB_PASSWORD || '6fxm3jycls',
  database: process.env.DB_NAME || 'westc2710564_1wzu2u',
  port: 3306,  // Port MySQL par défaut
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

const pool = mysql.createPool(dbConfig);

function cleanParams(params: any[]): any[] {
  return params.map(param => {
    if (param === undefined) return null;
    return param;
  });
}

// ✅ FONCTION PRINCIPALE - utilise execute() pour les requêtes préparées
export async function query(sql: string, params: any[] = []) {
  console.log('📝 SQL à exécuter:', sql);
  
  let connection;
  try {
    connection = await pool.getConnection();
    const cleanedParams = cleanParams(params);
    console.log('🔧 Paramètres:', cleanedParams);
    
    const [rows] = await connection.execute(sql, cleanedParams);
    return rows;
  } catch (error: any) {
    console.error('❌ Erreur SQL:', error.message);
    console.error('   Code:', error.code);
    console.error('   SQL:', sql);
    console.error('   Params:', cleanParams(params));
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// ✅ NOUVELLE FONCTION SPÉCIALEMENT POUR LES TRANSACTIONS
// Utilise query() au lieu de execute() pour les commandes non-préparées
export async function transactionQuery(sql: string) {
  console.log('🔄 Transaction SQL:', sql);
  
  let connection;
  try {
    connection = await pool.getConnection();
    // ✅ IMPORTANT: Utiliser query() au lieu de execute() pour les transactions
    const [rows] = await connection.query(sql);
    console.log('✅ Transaction réussie:', sql.trim());
    return rows;
  } catch (error: any) {
    console.error('❌ Erreur transaction:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// ✅ FONCTION TRANSACTION COMPLÈTE
export async function runTransaction(callback: (connection: mysql.PoolConnection) => Promise<any>) {
  const connection = await pool.getConnection();
  
  try {
    // ✅ Utiliser query() pour START TRANSACTION
    await connection.query('START TRANSACTION');
    
    const result = await callback(connection);
    
    // ✅ Utiliser query() pour COMMIT
    await connection.query('COMMIT');
    
    return result;
  } catch (error) {
    // ✅ Utiliser query() pour ROLLBACK
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
