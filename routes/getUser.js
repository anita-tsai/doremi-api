const fs = require('fs');
const jwt = require('jsonwebtoken');
const privateKey = fs.readFileSync('private.key');

const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// show own rooms
/*
// 1. Verify the token from headers and get the user_id from it
// 2. get all active (status_id = 1) rooms data by user_id
      and their category_name by joined category.id 
// 3. get room's images by room.id
// 4. profile: get user's data and email from google/facebook by joined google.id/ facebook.id
  response as {
    profile: {
      name,
      email,
      create_time
    },
    rooms: [
      {room}
    ]
  }
*/
const getUser = async (ctx, next) => {
  // 1. 
  const token = ctx.request.headers['authorization'].replace('Bearer ','')
  const decoded = jwt.verify(token, privateKey, { algorithms: 'RS256' });
  const userId = decoded.user_id

  // room table
  // 2. 
  let query = `
    SELECT r.*, c.value as category_name
    FROM room r
    JOIN category c on r.category_id = c.id
    WHERE r.status_id = '1' AND r.user_id = ?
    order by create_time desc;
  `;
  let [rows] = await promisePool.query(query, [
    userId
  ]);
  
  
  // each room
  // 3. 
  const tasks = rows.map(async (room) => {
    let query = `
      SELECT * FROM image WHERE room_id = ? order by sort;
    `;
    const [imageResults] = await promisePool.query(query,[
      room.id
    ]);
    const imagesUrls = imageResults.map((img) => {
      return img.image_url
    })

    return {
      ...room,
      images: imagesUrls
    }
  })
  
  const roomsResult = await Promise.all(tasks)

  // profile info
  // 4. 
  query = `
  SELECT u.*, google.email as google_email, facebook.email as facebook_email
  FROM user u
  LEFT JOIN google ON u.google_id = google.id
  LEFT JOIN facebook ON u.facebook_id = facebook.id
  WHERE u.id = ?
  order by create_time desc;
  `
  const [userRows] = await promisePool.query(query, [
    userId
  ]);
  
  const profileReulst = userRows[0]
  const result = {
    profile: profileReulst,
    rooms: roomsResult
  }
  
  ctx.body = result
};

module.exports = getUser