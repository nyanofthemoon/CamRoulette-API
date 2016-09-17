'use strict'

const CONFIG = require('./../config')

let server
var express = require('express')
var app = express()
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})
if ('development' === CONFIG.environment.name) {
  app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
  });
}
var http = require('http')
server = http.createServer(app)

let io = require('socket.io')(server)

let Api = require('./../modules/api')
let logger = new (require('./../modules/logger'))('SERVER', CONFIG)

Api.initialize(io, CONFIG).then(function (api) {
    io.sockets.on('connection', function (socket) {
      if (true === api.acceptsNewConnections()) {
        if (socket.handshake.query && socket.handshake.query.token && CONFIG.application.secrets.indexOf(socket.handshake.query.token) != -1) {
          logger.info('Socket Connected', socket.id)
          api.increaseConnectionCount()
          api.bindSocketToPublicEvents(socket)
          socket.on('disconnect', function () {
            logger.info('Socket Disconnected', this.id)
            api.decreaseConnectionCount()
            if (socket.room) {
              api.leave(socket)
            }
            let user = api.getUserBySocketId(this.id)
            if (user) {
              user.socket = null
            }
            api.removeSession(this)
          })
        } else {
          logger.info('Socket Not Connected - Wrong Application Token', socket.id)
          socket.emit('upgrade')
          socket.disconnect(true)
        }
      } else {
        logger.info('Socket Not Connected - Max Connection Reached', socket.id)
        socket.emit('maxconn')
        socket.disconnect(true)
      }
    })

    try {
      server.listen(CONFIG.environment.port)
      logger.success('Listening on port ' + CONFIG.environment.port)
    } catch (e) {
      logger.error('Not listening on port ' + CONFIG.environment.port, e)
    }

  })
  .catch(function(reason) {
    logger.error('Api Initialization Failure', reason)
  })