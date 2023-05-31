const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

const categoryMap = {
  '出售': 1,
  '徵求': 2,
  '交換': 3,
  '聊天': 4,
  '競標': 5
}

/*
// 1. Verify the token from headers and get the user_id from it
// 2. generate room_id
// 3. insert id, user_id, catogory_id, content, title to room
// 4. insert room_id, sort, content to tag
// 5. insert room_id, sort, image_url, file_name to image
// response  - UI doesn's use this api, it will call getDialogs again


*/
const postRoom = async (ctx, next) => {
  // 1.
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id
  const {
    category,
    content,
    title,
    tags,
    images = []
  } = ctx.request.body;

  const category_id = categoryMap[category]

  // 2. 
  const room_id = uuidv4();
  // 3.
  const query = `INSERT INTO room (
    id,
    user_id,
    category_id,
    content,
    title
  ) VALUES (
    ?,
    ?,
    ?,
    ?,
    ?
  );`;

  const [rows] = await promisePool.query(query, [
    room_id,
    userId,
    category_id,
    content,
    title
  ]);

  const tasks = tags.map(async (tag, index) => {
    // 4. 
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
      room_id,
      index,
      tag,
    ]);
  })
  
  await Promise.all(tasks);
  
  // save base64 image to file
  // 5. 
  const imgs = images.map(async (image, index) => {
    const fileName = `${room_id}-${index}.jpeg`
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
      room_id,
      index,
      filePath,
      fileName,
    ]);
  })

  await Promise.all(imgs)
  ctx.body = ctx.request.body;
}


module.exports = postRoom
