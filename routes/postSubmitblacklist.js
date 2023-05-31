const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// submit a new black list
/*
// 1. Verify the token from headers and get the user_id from it
// 2. generate blacklist_id
// 3. insert id, user_id, reported_user_id, title, event_time, reason, note to blacklist
// 4. insert blacklist_id, sort, image_url, file_name to image
// response  - UI doesn's use this api, it will call getBlacklist again
*/
const postSubmitblacklist = async (ctx, next) => {
  // 1.
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id
  const {
    reported_user_id,
    title,
    event_time,
    reason,
    note,
    images = []
  } = ctx.request.body;

  // 2. 
  const blacklist_id = uuidv4();
  // 3. 
  const query = `INSERT INTO blacklist (
    id,
    user_id,
    reported_user_id,
    title,
    event_time,
    reason,
    note
  ) VALUES (
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?
  );`;

  const [rows] = await promisePool.query(query, [
    blacklist_id,
    userId,
    reported_user_id,
    title,
    event_time,
    reason,
    note
  ]);

  
  // save base64 image to file
  // 4. 
  const imgs = images.map(async (image, index) => {
    const fileName = `${blacklist_id}-${index}.jpeg`
    const filePath = `images/${fileName}`
    fs.writeFileSync(filePath, image.replace(/^data:([A-Za-z-+/]+);base64,/, ''), 'base64');
    const query = `INSERT INTO blacklist_image (
      blacklist_id,
      sort,
      image_url,
      file_name
    ) VALUES (
      ?,
      ?,
      ?,
      ?
    );`;
    
    const [rows] = await promisePool.query(query, [
      blacklist_id,
      index,
      filePath,
      fileName,
    ]);
  })

  await Promise.all(imgs)
  ctx.body = ctx.request.body;
};

module.exports = postSubmitblacklist