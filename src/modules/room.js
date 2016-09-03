'use strict'

let Logger = require('./logger')

let deepExtend = require('deep-extend')

class Room {

  constructor(config) {
    this.logger = new Logger('ROOM', config)
    this.io = null
    this.initiator = null
    this.data = {
      name       : null,
      type       : null,
      status     : null,
      timer      : null,
      video      : null,
      stealth    : 'no',
      genderMatch: null,
      ageGroup   : null,
      scores     : {
        audio: 0,
        video: 0
      },
      results    : {
        audio: {},
        video: {}
      }
    }
  }

  initialize(io, data) {
    this.io = io
    deepExtend(this.data, data)
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

  getType() {
    return this.data.type
  }

  setType(type) {
    this.data.type = type
  }

  getStealth() {
    return this.data.stealth
  }

  isStealth() {
    return ('yes' === this.data.stealth)
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

  hasPositiveResultForStep(step) {
    if ('audio' === step) {
      return ( this.data.scores.audio >= 1 )
    } else {
      return ( this.data.scores.video >= 2 )
    }
  }

  _getFeelingScore(feeling) {
    switch(feeling) {
      case 'bored':
      case 'offended':
      case 'angry':
        return -1
      case 'charmed':
      case 'inspired':
      case 'entertained':
      case 'excited':
        return 1
      case 'undecided':
      default:
        return 0
    }
  }

  setResults(socket, step, feeling) {
    let update = 0;
    if (this.data.results[step][socket.id]) {
      update = this._getFeelingScore(this.data.results[step][socket.id]) * -1
    }
    this.data.scores[step] = this.data.scores[step] + update + this._getFeelingScore(feeling)
    this.data.results[step][socket.id] = feeling
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
      'type': 'room',
      'data': this.data
    }
    return struct
  }

}

module.exports = Room