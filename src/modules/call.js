'use strict'

let Logger = require('./logger')

let deepExtend = require('deep-extend')

class Call {

  constructor(config) {
    this.logger = new Logger('CALL', config)
    this.io = null
    this.initiator = null
    this.readyToSendOffer = false
    this.timeout = null
    this.closed = false
    this.data = {
      name       : null,
      status     : null,
      users      : {},
    }
  }

  initialize(io, data) {
    this.io = io
    deepExtend(this.data, data)
  }

  getName() {
    return this.data.name
  }

  getStatus() {
    return this.data.status
  }

  setStatus(status) {
    this.data.status = status
  }

  setInitiator(id) {
    this.initiator = id
  }

  getInitiator() {
    return this.initiator
  }

  getSockets() {
    let sockets = []
    for (var socketId in this.getSocketIds()) {
      sockets.push(this.io.of('/').connected[socketId])
    }
    return sockets
  }

  getSocketIds() {
    let socketIds = []
    let room = this.io.nsps['/'].adapter.rooms[this.getName()]
    if (room && room.sockets) {
      for (var key in room.sockets) {
        socketIds.push(key)
      }
    }
    return socketIds;
  }

  query() {
    var struct = {
      'type': 'call',
      'data': this.data
    }
    return struct
  }

}

module.exports = Call