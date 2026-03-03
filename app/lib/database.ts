import mysql from 'mysql2/promise';

// Configuration avec les nouveaux paramètres
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',  // ou localhost
  user: process.env.DB_USER || 'westc2710564_1wzu2u', 
  password: process.env.DB_PASSWORD || '6fxm3jycls',
  database: process.env.DB_NAME || 'westc2710564_1wzu2u',
  port: 3306,  // Port MySQL par défaut
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Le reste de votre code reste IDENTIQUE
const pool = mysql.createPool(dbConfig);

function cleanParams(params: any[]): any[] {
  return params.map(param => {
    if (param === undefined) return null;
    return param;
  });
}

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

export async function transactionQuery(sql: string) {
  console.log('🔄 Transaction SQL:', sql);
  
  let connection;
  try {
    connection = await pool.getConnection();
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
    connection.release();
  }
}

export default pool;