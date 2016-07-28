'use strict';

const CONFIG = require('./../config');

let io = require('socket.io')();

let Api    = require('./../modules/api');
let logger = new (require('./../modules/logger'))('SERVER', CONFIG);

Api.initialize(io, CONFIG).then(function (api) {
    io.sockets.on('connection', function (socket) {
      logger.info('Socket Connected', socket.id);
      api.bindSocketToPublicEvents(socket);
      socket.on('disconnect', function () {
        logger.info('Socket Disconnected', this.id);
        api.removeSession(this);
      });
    });

    try {
      io.listen(CONFIG.environment.port);
      logger.success('Listening on port ' + CONFIG.environment.port);
    } catch (e) {
      logger.error('Not listening on port ' + CONFIG.environment.port, e);
    }

  })
  .catch(function (reason) {
    logger.error('Api Initialization Failure', reason);
  });