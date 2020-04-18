const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const fs = require('fs');
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);

const { CMD_ONLINE } = require('./cmd')
 
// 首页路由
let router = new Router();
router.get('/', ctx => {
  ctx.response.type = 'html';
  ctx.response.body = fs.createReadStream('./admin/index.html');
});
app.use(router.routes());
 
const HANDLER_ADMIN = 'HANDLER_ADMIN'; // 后台
const HANDLER_CLIENT = 'HANDLER_CLIENT'; // Android 设备

let SOCKET_IDS = []
let CLIENT_ID_PHONE = []

// socket连接
io.on('connection', (socket) => {
  socket.on(HANDLER_ADMIN, (msg) => {
    console.log(HANDLER_ADMIN + ":" + JSON.stringify(msg));
    if (msg.cmd === CMD_ONLINE) {
      console.log("管理后台上线" + socket.id)
      SOCKET_IDS.push(socket.id)
    } else {
      if (msg.phones)
        msg.phones.forEach(phone => {
          let idPhone = CLIENT_ID_PHONE.find(id_phone => {
            return id_phone.phone === phone
          })
          io.sockets.sockets[idPhone.id].emit(HANDLER_CLIENT, msg)
        });
      // io.emit(HANDLER_CLIENT, msg) // all
    }
  });

  socket.on(HANDLER_CLIENT, (msg) => {
    console.log(HANDLER_CLIENT + ":" + msg);
    try {
      let msgObj = JSON.parse(msg)
      if (msgObj.cmd === CMD_ONLINE) {
        console.log("Android 设备上线" + socket.id)
        SOCKET_IDS.push(socket.id)
        CLIENT_ID_PHONE.push({ id: socket.id, phone: msgObj.text })
        console.log(CLIENT_ID_PHONE)
      }
      
    } catch (error) {
      console.log(error)
    }
    io.emit(HANDLER_ADMIN, msg);
  })

  socket.on('disconnect', (reason) => {
    SOCKET_IDS = SOCKET_IDS.filter(item => {
      return item !== socket.id
    })
    CLIENT_ID_PHONE = CLIENT_ID_PHONE.filter(item => {
      if (item.id === socket.id) {
        io.emit(HANDLER_ADMIN, { cmd: -1, msg: item.phone + "下线" });
      }
      return item.id !== socket.id
    })
    console.log('user disconnected' + ":" + socket.id + ":" + reason);
  });
});
 
// 监听端口
server.listen(3000, () => {
  console.log('listening on *:3000');
});