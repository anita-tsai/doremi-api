
const { getPromisePool } = require('../pool')
const promisePool = getPromisePool();

// show dialogs
/*
// 1. Get all dialogs by room_id and get the user_name by joined user_id
// response as {
      name, 
      content, 
      create_time, 
      user_id
    }
*/
const getDialogs = async (ctx, next) => {
  const result = {
    name: '',
    content: "",
    create_time: '',
    user_id: ''
  }

  let query = `
    SELECT user.name, dialog.content, dialog.create_time, dialog.user_id
    FROM dialog JOIN user ON dialog.user_id = user.id
    WHERE dialog.room_id = ?;
  `;
  let [rows] = await promisePool.query(query, [
    ctx.params.id
  ]);

  ctx.body = rows
 };

 module.exports = getDialogs