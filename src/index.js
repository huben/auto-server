const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const fs = require('fs');
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);
 
// 首页路由
let router = new Router();
router.get('/', ctx => {
  ctx.response.type = 'html';
  ctx.response.body = fs.createReadStream('./admin/index.html');
});
app.use(router.routes());
 
const HANDLER_ADMIN = 'HANDLER_ADMIN'; // 后台
const HANDLER_CLIENT = 'HANDLER_CLIENT'; // Android 设备

// socket连接
io.on('connection', (socket) => {
  socket.on(HANDLER_ADMIN, (msg) => {
    console.log(HANDLER_ADMIN + ":" + JSON.stringify(msg));
    io.emit(HANDLER_CLIENT, msg)
  });

  socket.on(HANDLER_CLIENT, (msg) => {
    console.log(HANDLER_CLIENT + ":" + msg);
    io.emit(HANDLER_ADMIN, msg);
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
 
// 监听端口
server.listen(3000, () => {
  console.log('listening on *:3000');
});