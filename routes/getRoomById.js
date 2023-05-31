const fs = require('fs');
const jwt = require('jsonwebtoken');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();



/* show one room
// 1. Verify the token from headers and get the user_id from it
// 2. according to room.id to get room's and the creator's data 
// 3. get tag and image by room.id
// 4. Check the user is the creator or not
// 5. Get all users which liked this room
// 6. Check is current user liked this room or not
  response as {
    likeAmount,
    isLike,
    isOwner,
    id,
    user_id,
    category_id,
    content,
    title,
    tags,
    images,
    create_time,
    name       
  }

*/

const getRoomById = async (ctx, next) => {
  // 1. 
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id
  const result = {
    id: "",
    user_id: "",
    category_id: "",
    content: "",
    title: "",
    tags:[],
    images: [],
    create_time: '',
    name: ''
  }

  // 2. 
  let query = `
    SELECT room.*, user.name
    FROM room JOIN user ON room.user_id = user.id
    WHERE room.id = ?;
  `;
  let [rows] = await promisePool.query(query, [
    ctx.params.id
  ]);
  result.id = rows[0].id
  result.user_id = rows[0].user_id
  result.category_id = rows[0].category_id
  result.content = rows[0].content
  result.title = rows[0].title
  result.create_time = rows[0].create_time
  result.name = rows[0].name

  // 3.
  query = `
  SELECT * FROM tag WHERE room_id = ? order by sort asc;
  `;
  [rows] = await promisePool.query(query, [
    ctx.params.id
  ]);
  result.tags = rows.map((tag) => {
    return tag.content
  })
  

  query = `
  SELECT * FROM image WHERE room_id = ? order by sort asc ;
  `;
  [rows] = await promisePool.query(query, [
  ctx.params.id
  ]);
  result.images = rows.map((image) => {
    return image.image_url
  })
  

  console.log(ctx.params.id, rows)
  ctx.body = result
  ctx.body.isOwner = false
  ctx.body.isLike = false

  // 4.
  if (userId === result.user_id) {
    ctx.body.isOwner = true
  }

  // 5.
  query = `
  SELECT * FROM is_like WHERE room_id = ?;
  `;

  const [user_rows] = await promisePool.query(query, [
    ctx.params.id
  ]);

  console.log(user_rows, 'userR')

  // 6. 
  const newRows = user_rows.filter((value) => {
    if(value.user_id === userId) {
      return true  
    }
    return false
  })

  console.log(newRows, 'newR')

  
  if (newRows.length === 0) {
    ctx.body.isLike = false
  } else {
    ctx.body.isLike = true
  }

  ctx.body.likeAmount = user_rows.length

 };

 module.exports = getRoomById