const port = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer();
server.listen(port);
console.log('listening on port 8000');

const Redis = require("ioredis");
const redis = new Redis();

// check redis connection
//(async () => {
//  const pong = await redis.ping();
//  console.log(pong); // => PONG
//
//  redis.disconnect();
//})();
//

// debug value on redis
//redis.monitor((err, monitor) => {
//  monitor.on("monitor", (time, args, source, database) => {
//    const a = {'aaa': {name: 'bbb'}, 'hoge': {name: 'huga'}}
//    console.log('monitor')
//    console.dir(args, {depth: null}); // 1458910076.446514:['set', 'foo', 'bar']
//  });
//});

const wsServer = new webSocketServer({
  httpServer: server
});

const clients = {};

const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
}

wsServer.on('request', function (request) {
  var userID = getUniqueID();
  console.log(`Received a new connection from origin ${request.origin}.`);

  const connection = request.accept(null, request.origin);
  clients[userID] = connection;

  console.log(`connected ${userID} in ${Object.getOwnPropertyNames(clients)}`);

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      //let result = {}
      sendedData = JSON.parse(message.utf8Data)
      switch (sendedData.type) {
        case 'login': {
          console.log('login command')
          console.dir(sendedData)
          loginProcess();
          async function loginProcess() {
            redis.lpush('users', sendedData.senderName)
            redis.hset(`users_${sendedData.senderName}`, 'name', sendedData.senderName, 'standby', false );
            const users = await getUsers()
            const result = {type: sendedData.type, senderName: sendedData.senderName, users: users }
            sendResultForClients(result)
          }
          break;
        }
        case 'setFields': {
          // updateFieldsに変えたい
          console.log('setFields command')
          const result = {type: sendedData.type, fields: sendedData.fields }
          sendResultForClients(result)
          break;
        }
        case 'updateUsers': {
          console.log('updateUsers command')
          const result = {type: sendedData.type, users: sendedData.users }
          sendResultForClients(result)
          break;
        }
        default: {
          console.log(`${sendedData.type} is undefined command`)
          break;
        }
      }
    }
  });
});

// redis
//const getUsers = () => {
  //console.log(redis.lrange('users', 0, -1))
  //const result = await redis.lrange('arr-key1', 0, -1)
  //console.log(result)

  //redis.get("users", function (err, result) {
  //  if (err) {
  //    console.error(err);
  //  } else {
  //    console.log(result); // Promise resolves to "bar"
  //  }
  //});
//}

async function getUsers() {
  console.log('getusers')
  const result = await redis.lrange('users', 0, -1)
  const users = {}
  for(let userName of result) {
    if(users[userName] === undefined) {
      users[userName] = {}
    }
    // まとめて書けそう
    users[userName]['name'] = await redis.hget(`users_${userName}`, 'name')
    const standby = await redis.hget(`users_${userName}`, 'standby')
    users[userName]['standby'] = stringToBoolean(standby)
  }

  // 共通ファイルにまとめてどこからでも呼び出せるようにするべき
  function stringToBoolean(str) {
    switch (str) {
      case 'true':
        return true
        break;
      case 'false':
        return false
        break;
      default:
        return null
        break;
    }
  }
  return users;
}

const sendResultForClients = (json) => {
  for(clientKey in clients) {
    clients[clientKey].send(JSON.stringify(json));
  }
}