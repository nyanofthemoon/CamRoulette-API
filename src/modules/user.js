'use strict'

let Logger = require('./logger')

class User {

  constructor(config) {
    this.logger = new Logger('USER', config)
    this.socket = null
    this.source = null
    this.data = {
      email:           null,
      gender:          null,
      birthday:        null,
      firstName:       null,
      lastName:        null,
      facebookProfile: null,
      facebookPicture: null,
      locale:          null,
      timezone:        null,
      wantedGender:    null,
      contacts:        []
    }
  }

  initialize(socket, source, data) {
    this.socket = socket
    this.source = source
    let that = this
    Object.keys(data).forEach(function (key) {
      that.data[key] = data[key]
    })
  }

  // Returns a promise
  static findOne(source, uid) {
    return source.hgetAsync('user', uid)
  }

  // Returns a promise
  static findAll(source) {
    return source.hgetallAsync('user')
  }

  // Returns a promise
  save() {
    return this.source.hsetAsync('user', this.getId(), JSON.stringify(this.data))
  }

  getId() {
    return this.data.email
  }

  getFirstName() {
    return this.data.firstName
  }

  getSocketId() {
    return this.socket.id
  }

  getEmail() {
    return this.data.email
  }

  getAgeRange() {
    let age = new Date().getFullYear() - new Date(this.data.birthday).getFullYear();
    if (age < 30) {
      return '18-29'
    } else if (age < 50) {
      return '30-49'
    } else {
      return '50-65'
    }
  }

  getGender() {
    return this.data.gender
  }

  getWantedGender() {
    if (!this.data.wantedGender) {
      if ('M' === this.data.gender) {
        return 'F'
      } else {
        return 'M'
      }
    }
    return this.data.wantedGender;
  }

  canRead(room) {
    return room.hasUser(this)
  }

  query() {
    var struct = {
      'type': 'user',
      'data': this.data
    }
    return struct
  }

}

module.exports = User