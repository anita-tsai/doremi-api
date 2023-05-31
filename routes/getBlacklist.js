const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();
/*
// show all blacklist
// 1. get blacklist and user name by joined user.id
// 2. get image from blacklist_image by blacklist.id
  response as {
    blacklist,
    image
  }
*/
const getBlacklist = async (ctx, next) => {
  let query = `
    SELECT b.*, user.name
    FROM blacklist b
    JOIN user ON b.user_id = user.id
    WHERE b.is_approve = '1'
    order by update_time desc;
  `;
  
  let [rows] = await promisePool.query(query, []);
  console.log('rows', rows)
  
  // each blacklist
  const tasks = rows.map(async (blacklist) => {
    query = `
      SELECT * FROM blacklist_image WHERE blacklist_id = ? order by sort;
    `;
    const [imageResults] = await promisePool.query(query,[
      blacklist.id
    ]);

    return {
      ...blacklist,
      images: imageResults.map((img) => {
        return img.image_url
      })
    }
  })
  results = await Promise.all(tasks)
  ctx.body = results
  
};

module.exports = getBlacklist