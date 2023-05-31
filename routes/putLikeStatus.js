const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// change like status
/*
// 1. Verify the token from headers and get the user_id from it
// 2. Check if this user liked this room before
      - get data from is_like by room_id and user_id
// 3. Flip the like status for this user
      - if the record from #2 doesn't exist, insert room_id, user_id to is_like
        else, delete data by is_like.id
// response  - UI doesn's use this api, it will call getRoomById again
*/
const putLikeStatus = async (ctx,next) => {
  // 1. 
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id

  // 2. 
  let query = `
  SELECT * FROM is_like
  WHERE room_id = ? 
  AND user_id = ?
  `
  const [user_rows] = await promisePool.query(query, [
    ctx.params.id,
    userId
  ]);

  console.log(user_rows)

  // 3. 
  if (user_rows.length === 0) {
    query = `
    INSERT INTO is_like (
      room_id,
      user_id
    ) VALUES (
      ?,
      ?
    );`;

    const [like_rows] = await promisePool.query(query, [
      ctx.params.id,
      userId
    ]);
  } else {
    query = `
    DELETE FROM is_like
    WHERE id = ?`;

    const [unlike_rows] = await promisePool.query(query, [
      user_rows[0].id
    ]);
  }


  ctx.body = 'success'
}

module.exports = putLikeStatus
