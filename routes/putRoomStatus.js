const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// change the status of rooms
/*
// 1. Verify the token from headers and get the user_id from it
// 2. Delete this room
      - update status_id = 2 by request.params.id (room_id)
// response  - UI doesn's use this api, it will back to homepage
// todo: check this user is creator
*/
const putRoomStatus = async (ctx,next) => {
  // 1. 
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id

  // const {
  //   content,
  //   title,
  //   images,
  //   tags
  // } = ctx.request.body;
  
  // 2. 
  const query = `
    UPDATE room SET
    status_id = 2 WHERE
    id = ?
  `
  await promisePool.query(query, [
    ctx.params.id
  ]);
  ctx.body = 'success'
}

module.exports = putRoomStatus