'use strict'

let Logger = require('./logger')

const STATUS_INACTIVE = 'inactive'
const STATUS_WAITING  = 'waiting'
const STATUS_ACTIVE   = 'active'

class Room {

  constructor(config) {
    this.logger = new Logger('ROOM', config)
    this.io = null
    this.socketIds = []
    this.data = {
      name       : null,
      ageGroup   : null,
      genderMatch: null,
      status     : STATUS_INACTIVE,
      round      : 1
    }
  }

  initialize(io, data) {
    this.io = io
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

  hasUser(user) {
    if (this.socketIds.indexOf(user.getSocketId()) != -1) {
      return true
    }
    return false
  }

  addUser(user) {
    this.socketIds.push(user.getSocketId())
  }

  getSocketIds() {
    var socketIds = this.io.nsps['/'].adapter.rooms[this.getName()];
    if (socketIds && socketIds.sockets) {
      var collection = [];
      for (var key in socketIds.sockets) {
        collection.push(key);
      }
      return collection;
    } else {
      return [];
    }
  }

  query() {
    var struct = {
      'type': 'room',
      'data': this.data
    }
    return struct
  }

}

module.exports = Room