const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// update room
/*
// 1. Verify the token from headers and get the user_id from it
// 2. update the room's data (within room table directly)
      - update content, title by room.id
// 3. Update room's tags
      - delete the original tags records for this room
        and insert new records (room_id, sort, content) into tag table
// 4. Update room's images
      - delete the original images records for this room
        and insert new records (room_id, sort, image_url, file_name) into image table
// response  - UI doesn's use this api, it back to homepage
// todo: check this user is creator
*/
const putRoomById = async (ctx,next) => {
  // 1. 
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id

  const {
    content,
    title,
    images,
    tags
  } = ctx.request.body;
  
  // 2. 
  const sql = `
    UPDATE room SET
    content = ?,
    title = ?
    WHERE id = ?

  `
  await promisePool.query(sql, [
    content,
    title,
    ctx.params.id
  ]);

  // 3. 
  await promisePool.query(`
    DELETE FROM tag
    WHERE room_id = ?`
  , [ctx.params.id])

  const tasks = tags.map(async (tag, index) => {
    const query = `INSERT INTO tag (
      room_id,
      sort,
      content
    ) VALUES (
      ?,
      ?,
      ?
    );`;
    
    const [rows] = await promisePool.query(query, [
      ctx.params.id,
      index,
      tag,
    ]);
  })
  
  await Promise.all(tasks);

  // 4. 
  await promisePool.query(`
    DELETE FROM image
    WHERE room_id = ?`
  , [ctx.params.id])

  const imgs = images.map(async (image, index) => {
    const fileName = `${ctx.params.id}-${index}.jpeg`
    const filePath = `images/${fileName}`
    fs.writeFileSync(filePath, image.replace(/^data:([A-Za-z-+/]+);base64,/, ''), 'base64');
    const query = `INSERT INTO image (
      room_id,
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
      ctx.params.id,
      index,
      filePath,
      fileName,
    ]);
  })

  await Promise.all(imgs)


  ctx.body = { message: 'success' }

}

module.exports = putRoomById