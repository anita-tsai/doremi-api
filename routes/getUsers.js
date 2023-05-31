const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// fetch user table
/*
// 1. get user.id and user.name from user
response as [{ id, name }]
*/
const getUsers = async (ctx, next) => {
  let query = `
    SELECT user.id, user.name
    FROM user
    order by name;
  `;
  let [rows] = await promisePool.query(query, []);

  ctx.body = rows
 };

 module.exports = getUsers