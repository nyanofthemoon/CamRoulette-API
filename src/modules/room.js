'use strict'

let Logger = require('./logger')

const STATUS_INACTIVE = 'inactive'
const STATUS_WAITING  = 'waiting'
const STATUS_ACTIVE   = 'active'

class Room {

  constructor(config) {
    this.logger = new Logger('ROOM', config)
    this.data = {
      name  : null,
      status: STATUS_INACTIVE,
      round : 1
    }
  }

  initialize(io, data) {
    this.io  = io
    let that = this
    Object.keys(data).forEach(function (key) {
      that.data[key] = data[key]
    })
  }

  getName() {
    return this.data.name
  }

  getStatus() {
    return this.data.status
  }

  getSocketIds() {
    var room = this.io.nsps['/'].adapter.rooms[this.getName()];
    if (room && room.sockets) {
      var collection = [];
      for (var key in room.sockets) {
        collection.push(key);
      }
      return collection;
    } else {
      return [];
    }
  }

}

module.exports = Room