'use strict'

let Logger = require('./logger')

let deepExtend = require('deep-extend')
let MD5 = require('crypto-js/md5')

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
      id       : null,
      email    : null,
      firstname: null,
      lastname : null,
      providers: {
        facebook: {
          url    : null,
          picture: null
        }
      },
      profile: {
        nickname   : null,
        gender     : null,
        birthday   : null,
        agegroup   : null,
        orientation: null,
        friendship : null,
        headline   : null,
        bio        : null,
        education  : null,
        employment : null,
        diet       : null, // unhealthy, healthy, vegetarian, vegan, intolerant, other
        picture    : null,
        astrological: {
          chinese   : null,
          zodiac    : null,
          birthstone: null,
          planet    : null,
          element   : null
        }
      },
      personality: {
        // http://www.livescience.com/41313-personality-traits.html
      },
      location: {
        city     : null,
        country  : null,
        latitude : null,
        longitude: null,
        locale   : null,
        timezone : null
      },
      contacts: {
        friendship  : {},
        relationship: {},
        blocked     : {}
      },
      reports: {
        reported  : 0,
        reportedby: 0
      },
      offlineMessages: []
    }
  }

  initialize(socket, source, data) {
    this.socket = socket
    this.source = source
    deepExtend(this.data, data)
    if (!this.data.id) {
      this.data.id = User.generateId(this.data.email)
    }
  }

  // Returns a promise
  static findOne(source, uid) {
    return source.hgetAsync('user', uid)
  }

  // Returns a promise
  static findAll(source) {
    return source.hgetallAsync('user')
  }

  static generateId(email) {
    return MD5(email).toString()
  }

  getId() {
    return this.data.id
  }

  // Returns a promise
  save() {
    return this.source.hsetAsync('user', this.getId(), JSON.stringify(this.data))
  }

  getNickname() {
    return this.data.profile.nickname
  }

  acceptsAllAgeGroups() {
    return ('no' === this.data.profile.agegroup)
  }

  getSocketId() {
    return this.socket.id
  }

  getTimesReported() {
    return this.data.reports.reportedby
  }

  getAmountOfReports() {
    return this.data.reports.reported
  }

  hasBlocked(id) {
    if (this.data.contacts.blocked[id]) {
      return true
    }
    return false
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

  blockUser(user) {
    let blockedUserId = user.getId()
    this.data.contacts.blocked[blockedUserId] = blockedUserId
    this.removeRelationship(user)
    this.removeFriendship(user)
    user.removeRelationship(this)
    user.removeFriendship(this)
  }

  hasTooManyReports() {
    return (this.getAmountOfReports() > 10)
  }

  reportUser(user) {
    if (false === this.hasTooManyReports()) {
      user.data.reports.reportedby = user.data.reports.reportedby + 1
    }
    this.data.reports.reported = this.data.reports.reported + 1
  }

  getAgeRange() {
    if (false === this.acceptsAllAgeGroups()) {
      let age = this.getAge()
      if (age < 30) {
        return '18-29'
      } else if (age < 50) {
        return '30-49'
      } else if (age < 65) {
        return '50-64'
      } else {
        return '65-99'
      }
    } else {
      return '18-99'
    }
  }

  getAge() {
    return new Date().getFullYear() - new Date(this.data.profile.birthday).getFullYear()
  }

  getDatingOrientation() {
    return this.data.profile.orientation
  }

  getFriendshipOrientation() {
    return this.data.profile.friendship
  }

  getGender() {
    return this.data.profile.gender
  }

  getWantedGenderFriend() {
    // Same Gender
    if ('S' === this.getFriendshipOrientation()) {
      return this.getGender()
    // Opposite Gender
    } else if ('O' === this.getFriendshipOrientation()) {
      if ('M' === this.getGender()) {
        return 'F'
      } else {
        return 'M'
      }
    // Any Gender
    } else {
      if (Math.floor((Math.random() * 100)) < 50) {
        return 'M'
      } else {
        return 'F'
      }
    }
  }

  getWantedGenderForRoom(type) {
    if ('relationship' === type) {
      if ('O' === this.getDatingOrientation()) {
        if ('M' === this.getGender()) {
          return 'FM'
        } else {
          return 'MF'
        }
      } else {
        return this.getWantedGenderDate()
      }
    } else {
      if ('O' === this.getFriendshipOrientation()) {
        if ('M' === this.getGender()) {
          return 'M'
        } else {
          return 'F'
        }
      } else {
        return this.getWantedGenderFriend()
      }
    }
  }

  getWantedGenderDate() {
    // Same Gender
    if ('S' === this.getDatingOrientation()) {
      if ('M' === this.getGender()) {
        return 'MM'
      } else {
        return 'FF'
      }
    // Opposite Gender
    } else if ('O' === this.getDatingOrientation()) {
      if ('M' === this.getGender()) {
        return 'MF'
      } else {
        return 'FM'
      }
    // Any Gender
    } else {
      return 'AA'
    }
  }

  addOfflineMessage(message) {
    this.data.offlineMessages.push(message)
    if (this.data.offlineMessages.length > 100) {
      this.data.offlineMessages = this.data.offlineMessages.slice(0, 100)
    }
  }

  pushOfflineMessages() {
    if (this.data.offlineMessages.length > 0) {
      let that = this
      this.data.offlineMessages.forEach(function(message, i) {
        that.socket.emit('message', message)
        delete(that.data.offlineMessages[i])
      })
    }
  }

  query(self) {
    var struct = {
      type: 'user',
      self: self,
      data: JSON.parse(JSON.stringify(this.data))
    }
    delete(struct.data.email)
    delete(struct.data.firstname)
    delete(struct.data.lastname)
    delete(struct.data.offlineMessages)
    if (false === self) {
      delete(struct.data.providers)
      delete(struct.data.contacts)
      delete(struct.data.reports)
    }
    return struct
  }

}

module.exports = User