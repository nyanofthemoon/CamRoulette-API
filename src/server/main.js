'use strict'

const CONFIG = require('./../config')

let server
if ('development' === CONFIG.environment.name) {
  var express = require('express')
  var app = express()
  app.get('/', function(req, res){
    console.log('ffsdf')
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
      logger.info('Socket Connected', socket.id)
      api.bindSocketToPublicEvents(socket)
      if ('development' === CONFIG.environment.name) {
        api.bindSocketToPrivateEvents(socket)
      }
      socket.on('disconnect', function () {
        logger.info('Socket Disconnected', this.id)
        api.removeSession(this)
        if (socket.room) {
          var room = socket.room
          io.to(room).emit('leave', socket.id)
          socket.leave(room)
          api.removeRoom(room)
        }
      })
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