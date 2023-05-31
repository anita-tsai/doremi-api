const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();
/*
// post-> signin
// 1. insert data from google/ facebook
// 2. get google.id or facebook.id => login_id
// 3. according to login_id to insert data to user from google/ facebook 
// 4. according to login_id to get user_id
// 5. generate token with user_id & name
// 6. update user's avatar by user_id
  response as {
    token, 
    name
  }
*/

const postSignin = async (ctx, next) => {
  const {
    external_id,
    name,
    email,
    avatar,
    type
  } = ctx.request.body

  // 1. 
 
  // create google's or facebook's id
  let login_id = uuidv4();

  // avoid duplicate records in SQL
  let query = '';
  if (type === 'google') {
    query = `INSERT INTO google (
      id,
      external_id,
      email
    ) VALUES (
      ?,
      ?,
      ?
    ) ON duplicate KEY UPDATE email = email;`;
  } else if (type === 'facebook') {
    query = `INSERT INTO facebook (
      id,
      external_id,
      email
    ) VALUES (
      ?,
      ?,
      ?
    ) ON duplicate KEY UPDATE email = email;`;

  } else {
    ctx.status = 422;
    ctx.body = {
      message: 'bababa'
    }
    return
  }
  

  await promisePool.query(query, [
    login_id,
    external_id,
    email
  ]);

  // 2.
  // get id from previous data
  let sql = ''
  if (type === 'google') {
    sql = `SELECT id from google WHERE external_id = ?`
  } else if (type === 'facebook') {
    sql = `SELECT id from facebook WHERE external_id = ?`
  }
  
  const [rows] = await promisePool.query(sql, [
    external_id,
  ]);

  // get google.id or facebook.id from rows
  login_id = rows[0].id

  // 3.
  // create user's id
  let id = uuidv4();
  
  const user_query = `INSERT INTO user (
    id,
    name,
    avatar,
    ${type === 'google' ? 'google_id' : 'facebook_id'}
  ) VALUES (
    ?,
    ?,
    ?,
    ?
  ) ON duplicate KEY UPDATE name = name;`;

  const [user_rows] = await promisePool.query(user_query, [
    id,
    name,
    avatar,
    login_id
  ]);

  

  // 4.
  // get id from previous data
  const userIdSql = `SELECT id from user WHERE ${type === 'google' ? 'google_id' : 'facebook_id'} = ?`
  
  const [userRows] = await promisePool.query(userIdSql, [
    login_id,
  ]);

  // to get id from rows
  id = userRows[0].id

  // 5.
  const token = jwt.sign({ user_id: id }, privateKey, { algorithm: 'RS256' });
  

  // 6.
  // update its avatar
  const avatar_query = `
    UPDATE user SET
    avatar = ? WHERE
    id = ?
  `
  await promisePool.query(avatar_query, [
    avatar,
    id
  ]);


  ctx.body = {
    token,
    name: name
  }

};

module.exports = postSignin
