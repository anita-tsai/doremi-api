const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const cors = require('@koa/cors');
const serve = require('koa-static');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('private.key');


const { getPromisePool } = require('./pool')

const postSignin = require('./routes/postSignin');
const postRoom = require('./routes/postRoom');
const postDialogs = require('./routes/postDialogs');
const postSubmitblacklist = require('./routes/postSubmitblacklist');
const getRooms = require('./routes/getRooms');
const getRoomById = require('./routes/getRoomById');
const getUser = require('./routes/getUser');
const getDialogs = require('./routes/getDialogs');
const getBlacklist = require('./routes/getBlacklist');
const getUsers = require('./routes/getUsers');
const putRoomStatus = require('./routes/putRoomStatus');
const putLikeStatus = require('./routes/putLikeStatus');
const putRoomById = require('./routes/putRoomById');

const promisePool = getPromisePool();

const app = new Koa();
const router = new Router();
app.use(bodyParser({ limit: '100mb' }));
app.use(cors());
app.use(serve('.'));






// create a new room
router.post('/room', postRoom);

// show all rooms
// to do: filter by 'create_time' or 'update_time'
// to do: show 10 rooms, others show loading
router.get('/rooms', getRooms);

// show one room
router.get('/rooms/:id', getRoomById);



// show own rooms
router.get('/user', getUser);

// post -> signin
router.post('/signin', postSignin);

// create a dialog
router.post('/dialogs', postDialogs);

// show dialogs
router.get('/rooms/:id/dialogs', getDialogs);


// change the status of rooms
router.put('/rooms/:id/status' , putRoomStatus)

// change like status
router.put('/rooms/:id/like', putLikeStatus)


// update room
router.put('/rooms/:id', putRoomById)



// submit a new black list
router.post('/submitblacklist', postSubmitblacklist);


// show blacklists
router.get('/blacklist', getBlacklist);


// fetch user table
router.get('/users', getUsers);


app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4000);


