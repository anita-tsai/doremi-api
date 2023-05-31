const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();


const categoryMap = {
  '出售': 1,
  '徵求': 2,
  '交換': 3,
  '聊天': 4,
  '競標': 5
}

// show all rooms
/*
// 1-1. get all active (status_id = 1) rooms data
      and their category_name & creator's data by joined category.id & user.id
// 1-2. Filter room by request condition:
      (1) category - if category passed, filter out only that category room
      (2) content - if content passed, find the room that the content exist
      (3) tags - if tags passed, find the room that have the tags -> step 3
// 2. get tag, image by room.id
// 3. Filter room by tags passed:
//
  response as {
    room,
    tags,
    images
  }
*/

const getRooms = async (ctx, next) => {
  let results = []
  let { category, content, tags = '[]' } = ctx.request.query
  tags = JSON.parse(tags) // "["abc", "cde"]" -> ['abc', 'cde']
  // 1. 
  let query = `
    SELECT r.*, c.value as category_name, u.name, u.avatar
    FROM room r
    JOIN category c on r.category_id = c.id
    JOIN user u on r.user_id = u.id
    WHERE r.status_id = '1'
    ${ category ? 'AND r.category_id = ?' : ''}
    ${ content ? `AND r.content LIKE '%${content}%'` : ''}
    order by update_time desc;
  `;
  
  const category_id = categoryMap[category]
  let [rows] = await promisePool.query(
    query, 
    category_id ? [category_id] : []
  );

  // each room
  // 2.
  const tasks = rows.map(async (room) => {
    let query = `
      SELECT * FROM tag WHERE room_id = ? order by sort;
    `;
    const [tagResults] = await promisePool.query(query, [
      room.id
    ]);
    const tagContents = tagResults.map((tag) => {
      return tag.content
    });

    // /*
    //   request - [abc, cde]
    //   room - [aaa, abc] - no: 1, -1
    //   room - [aaa, abc, cde] - yes: 1, 2
    // */
    // if (tags.length > 0) {
    //   return !tags.any(t => tagContents.indexOf(t) === -1)
    // } 

    query = `
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
      tags: tagContents,
      images: imagesUrls
    }
  })
  results = await Promise.all(tasks)
  results = results.filter(r => {
    /*
      request - [abc, cde]
      room - [aaa, abc] - no: 1, -1
      room - [aaa, abc, cde] - yes: 1, 2
      room - [abc] - no: 0, -1
    */

    // 3.
    if (tags.length > 0) {
      return !tags.any(t => r.tags.indexOf(t) === -1)
    }
    return true
  })
  ctx.body = results
  
};

module.exports = getRooms