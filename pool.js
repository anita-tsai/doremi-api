const mysql = require('mysql2');

let promisePool = null

const getPromisePool = () => {
  if (!promisePool) {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'sys',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    promisePool = pool.promise();
  }
  return promisePool;
}

module.exports = {
  getPromisePool
}