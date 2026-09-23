const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '4ndy3chenique',
  database: 'bd_operativa_central',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then((conn) => {
    console.log('✅ Conexión exitosa a MySQL (bd_operativa_central)');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error de conexión a MySQL:', err.message);
  });

module.exports = pool;