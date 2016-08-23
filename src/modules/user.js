'use strict'

let Logger = require('./logger')

/*
Friendship
 S: 'Same Gender',
 A: 'Any Gender'
 O: 'Opposite Gender',
Orientation
  O: 'Opposite Gender',
  S: 'Same Gender',
  A: 'Any Gender'
*/

class User {

  constructor(config) {
    this.logger = new Logger('USER', config)
    this.socket = null
    this.source = null
    this.data = {
      email          : null,
      gender         : null,
      birthday       : null,
      firstName      : null,
      lastName       : null,
      facebookProfile: null,
      facebookPicture: null,
      locale         : null,
      timezone       : null,
      friendship     : null,
      orientation    : null,
      latitude       : null,
      longitude      : null,
      contacts       : {
        friendship  : {},
        relationship: {}
      },
      reports        : 0,
      reported       : []
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

  getReports() {
    return this.data.reports
  }

  hasReported(id) {
    return this.data.reported.indexOf(id) !== -1
  }

  addFriendship(user) {
    let id = user.getId()
    if (this.getId() != id) {
      this.data.contacts.friendship[id] = id
    }
  }

  removeFriendship(user) {
    delete(this.data.contacts.friendship[user.getId()])
  }

  addRelationship(user) {
    let id = user.getId()
    if (this.getId() != id) {
      this.data.contacts.relationship[id] = id
    }
  }

  removeRelationship(user) {
    delete(this.data.contacts.relationship[user.getId()])
  }

  getAgeRange() {
    let age = new Date().getFullYear() - new Date(this.data.birthday).getFullYear();
    if (age < 30) {
      return '18-29'
    } else if (age < 50) {
      return '30-49'
    } else if (age < 65) {
      return '50-64'
    } else {
      return '65-99'
    }
  }

  getGender() {
    return this.data.gender
  }

  getWantedGender() {
    // Same Gender - Homosexual
    if ('S' === this.data.orientation) {
      if ('M' === this.data.gender) {
        return 'MM'
      } else {
        return 'FF'
      }
    // Any Gender - Bisexual
    } else if ('A' === this.data.orientation) {
      return 'AA'
    // Opposite Gender - Straight
    } else {
      if ('M' === this.data.gender) {
        return 'F'
      } else {
        return 'M'
      }
    }
  }

  canRead(room) {
    return room.hasUser(this)
  }

  query() {
    var struct = {
      'type': 'user',
      'data': this.data
    }
    delete(struct['reports'])
    delete(struct['reported'])
    return struct
  }

}

module.exports = User