const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();


// create a dialog
/*
// 1. Verify the token from headers and get the user_id from it
// 2. insert room_id, user_id, content to dialog
// response as [{ content, room_id}] - UI doesn's use this api, it will call getDialogs again

*/
const postDialogs = async (ctx, next) => {
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id
  
  const {
    content,
    room_id
  } = ctx.request.body;

  const query = `INSERT INTO dialog (
    room_id,
    user_id,
    content
  ) VALUES (
    ?,
    ?,
    ?
  );`;

  const [rows] = await promisePool.query(query, [
    room_id,
    userId,
    content
  ]);
  
  ctx.body = ctx.request.body;
};

module.exports = postDialogs
