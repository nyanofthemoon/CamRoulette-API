'use strict'

const CONFIG = require('./../config')

let server
if ('development' === CONFIG.environment.name) {
  var express = require('express')
  var app = express()
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
  });
  var http = require('http')
  server = http.createServer(app)
} else {
  var https = require('https')
  server = https.createServer({})
}
let io = require('socket.io')(server)

let Api = require('./../modules/api')
let logger = new (require('./../modules/logger'))('SERVER', CONFIG)

Api.initialize(io, CONFIG).then(function (api) {
    io.sockets.on('connection', function (socket) {
      if (socket.handshake.query && socket.handshake.query.token && CONFIG.application.secrets.indexOf(socket.handshake.query.token) != -1) {
        logger.info('Socket Connected', socket.id)
        api.bindSocketToPublicEvents(socket)
        socket.on('disconnect', function () {
          logger.info('Socket Disconnected', this.id)
          api.removeSession(this)
          if (socket.room) {
            api.leave(socket)
            let room = api.getRoomByName(socket.room)
            if (room) {
              api.removeRoomFromAssoc(room)
            }
          }
        })
      } else {
        logger.info('Socket Not Connected - Wrong Application Token', socket.id)
        socket.emit('upgrade')
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