'use strict'

let Logger = require('./logger')

class Room {

  constructor(config) {
    this.logger = new Logger('ROOM', config)
    this.io = null
    this.initiator = null
    this.data = {
      name       : null,
      status     : null,
      timer      : null,
      video      : null,
      genderMatch: null,
      ageGroup   : null,
      results    : {
        audio: {},
        video: {}
      }
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

  getGenderMatch() {
    return this.data.genderMatch
  }

  getAgeGroup() {
    return this.data.ageGroup
  }

  getStatus() {
    return this.data.status
  }

  setStatus(status) {
    this.data.status = status
  }

  setVideo(video) {
    this.data.video = video
  }

  setTimer(seconds) {
    this.data.timer = seconds
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