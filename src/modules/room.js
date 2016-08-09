'use strict'

let Logger = require('./logger')

class Room {

  constructor(config) {
    this.logger = new Logger('ROOM', config)
    this.io = null
    this.logs = []
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

  hasUser(user) {
    if (this.socketIds.indexOf(user.getSocketId()) != -1) {
      return true
    }
    return false
  }

  getSockets() {
    var socketIds = this.io.nsps['/'].adapter.rooms[this.getName()];
    if (socketIds) {
      var collection = [];
      for (var key in socketIds) {
        collection.push(key);
      }
      return collection;
    } else {
      return [];
    }
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