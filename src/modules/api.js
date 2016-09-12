'use strict'

let Logger = require('./logger')
let Redis = require('./redis')
let Room = require('./room')
let User = require('./user')

let Astrology = require('./../helpers/astrology')

class Api {

  constructor(config) {
    this.logger  = new Logger('API', config)
    this.config  = config
    this.sockets = null
    this.source  = null
    this.workers = {}
    this.data    = {
      sessions: {},
      users   : {},
      assoc   : {},
      queue   : {
        relationship: {
          'MF': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          },
          'FM': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          },
          'MM': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          },
          'FF': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          },
          'AA': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          }
        },
        friendship: {
          'M': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          },
          'F': {
            '18-29': { 'yes': new Map(), 'no': new Map() },
            '30-49': { 'yes': new Map(), 'no': new Map() },
            '50-64': { 'yes': new Map(), 'no': new Map() },
            '65-99': { 'yes': new Map(), 'no': new Map() },
            '18-99': { 'yes': new Map(), 'no': new Map() }
          }
        }
      },
      lastMatch: {
        leftEmoticon : 'undecided',
        leftGender   : 'M',
        rightEmoticon: 'undecided',
        rightGender  : 'F',
        lastUpdated  : new Date().getTime()
      }
    }
  }

  static initialize(io, config) {
    return new Promise(function (resolve, reject) {
      let api = new Api(config)
      api.sockets = io
      new Redis(config).initialize()
        .then(function (clientOne) {

          // Subscribe to Events
          clientOne.subscribe('system')

          // Handle Event Messages
          clientOne.on('message', function (channel, message) {
            try {
              message = JSON.parse(message)
              switch (channel) {
                case 'system':
                  switch (message.type) {
                    case 'save-users':
                      for (let key in api.data.users) {
                        api.data.users[key].save()
                      }
                      break
                    case 'disconnect-users':
                      for (let key in api.data.users) {
                        let userSocket = api.data.users[key].socket
                        userSocket.disconnect(true)
                        api.removeSession(userSocket)
                      }
                      break
                    default:
                      break
                  }
                default:
                  break
              }
              api.logger.info('Notification received from ' + channel, message)
            } catch (e) {
              api.logger.error('Notification error from ' + channel + ' with ' + message, e)
            }
          })

          // Initialize Data
          new Redis(config).initialize()
            .then(function (clientTwo) {
              api.source = clientTwo
              User.findAll(api.source)
                .then(function (users) {
                  if (users) {
                    Object.keys(users).forEach(function (key) {
                      let user = new User(config)
                      user.initialize(null, api.source, JSON.parse(users[key]))
                      api.data.users[user.getId()] = user
                    })
                  }
                  resolve(api)
                }).catch(function (e) {
                reject(e)
              })

            }).catch(function (e) {
            reject(e)
          })

        }).catch(function (e) {
        reject(e)
      })
    })
  }

  addSession(socket, user) {
    if (socket && user) {
      this.data.sessions[socket.id] = user.getId()
    }
  }

  removeSession(socket) {
    delete(this.data.sessions[socket.id])
  }

  addUser(user) {
    if (user) {
      this.data.users[user.getId()] = user
    }
  }

  getUsers() {
    return this.data.users || {}
  }

  addRoom(room) {
    let name = room.getName()
    let genderMatch = room.getGenderMatch()
    let ageGroup = room.getAgeGroup()
    let type = room.getType()
    let stealth = room.getStealth()
    this.data.assoc[name] = {
      genderMatch: genderMatch,
      ageGroup   : ageGroup,
      type       : type,
      room       : room,
      stealth    : stealth
    }
    this.data.queue[type][genderMatch][ageGroup][stealth].set(name, name)
  }

  getRoomByName(name) {
    let data = this.data.assoc[name]
    if (data) {
      return data.room
    }
    return null
  }

  removeRoomFromQueue(room) {
    let name = room.getName()
    let genderMatch = room.getGenderMatch()
    let ageGroup = room.getAgeGroup()
    let type = room.getType()
    let stealth = room.getStealth()
    this.data.queue[type][genderMatch][ageGroup][stealth].delete(name)
  }

  removeRoomFromAssoc(room) {
    let name = room.getName()
    delete(this.data.assoc[name])
  }

  getNextRoomByQuery(genderMatch, ageGroup, type, stealth, random) {
    if (!random) { random = false }
    if ('relationship' === type) {
      return this._getNextDateRoomByQuery(genderMatch, ageGroup, stealth, random)
    } else {
      return this._getNextFriendRoomByQuery(genderMatch, ageGroup, stealth, random)
    }
  }

  _getNextDateRoomByQuery(genderMatch, ageGroup, stealth, random) {
    let match = null
    if (false === random) {
      match = this.data.queue['relationship'][genderMatch][ageGroup][stealth].keys().next()
    } else {
      var keys = this.data.queue['relationship'][genderMatch][ageGroup][stealth].keys()
      match    = this.data.queue['relationship'][genderMatch][ageGroup][stealth].keys()[keys[ keys.length * Math.random() << 0]]
    }
    if (match) {
      return this.getRoomByName(match.value)
    }
    return null
  }

  _getNextFriendRoomByQuery(genderMatch, ageGroup, stealth, random) {
    let match = null
    if (false === random) {
      match = this.data.queue['friendship'][genderMatch][ageGroup][stealth].keys().next()
    } else {
      var keys = this.data.queue['friendship'][genderMatch][ageGroup][stealth].keys()
      match    = this.data.queue['friendship'][genderMatch][ageGroup][stealth].keys()[keys[ keys.length * Math.random() << 0]]
    }
    if (match) {
      return this.getRoomByName(match.value)
    }
    return null
  }

  getUserById(id) {
    return this.data.users[id] || null
  }

  getUserBySocketId(id) {
    return this.data.users[this.data.sessions[id]] || null
  }

  setLastMatch(room, step) {
    let newMatchData = {
      lastUpdated  : new Date().getTime(),
      rightEmoticon: 'undecided',
      leftEmoticon : 'undecided'
    }
    let creator = this.getUserById(room.getInitiator())
    newMatchData.leftGender = creator.getGender()
    creator = creator.getSocketId()
    let that = this
    Object.keys(room.data.results[step]).forEach(function(socketId) {
      if (socketId != creator) {
        let joiner = that.getUserBySocketId(socketId)
        newMatchData.rightGender   = joiner.getGender()
        newMatchData.rightEmoticon = room.data.results[step][socketId]
      } else {
        newMatchData.leftEmoticon = room.data.results[step][socketId]
      }
    })
    this.data.lastMatch = newMatchData
  }

  getLastMatch() {
    return {
      type: 'room',
      data: {
        'room': 'matches',
        'data': this.data.lastMatch
      }
    }
  }

  runTimer(room) {
    try {
      let that = this
      let name = room.getName()
      // STATUS_AUDIO
      this.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_AUDIO)
      room.setStatus(this.config.room.STATUS_AUDIO)
      room.setVideo(false)
      room.setTimer(this.config.room.WAIT_TIME_AUDIO_CONVERSATION)
      this.sockets.to(name).emit('query', room.query())
      setTimeout(function () {
        if (room.getSocketIds().length > 1) {
          that.logger.verbose('[TIMER] ' + name + ' ' + that.config.room.STATUS_AUDIO_SELECTION)
          room.setStatus(that.config.room.STATUS_AUDIO_SELECTION)
          room.setTimer(that.config.room.WAIT_TIME_SELECTION_SCREEN)
          that.sockets.to(name).emit('query', room.query())
          // STATUS_AUDIO_SELECTION
          setTimeout(function () {
            if (room.getSocketIds().length > 1) {
              that.logger.verbose('[TIMER] ' + name + ' ' + that.config.room.STATUS_AUDIO_RESULTS)
              room.setStatus(that.config.room.STATUS_AUDIO_RESULTS)
              room.setTimer(that.config.room.WAIT_TIME_RESULT_SCREEN)
              that.sockets.to(name).emit('query', room.query())
              if (room.hasPositiveResultForStep('audio')) {
                // STATUS_AUDIO_RESULTS
                setTimeout(function () {
                  if (room.getSocketIds().length > 1) {
                    that.logger.verbose('[TIMER] ' + name + ' ' + that.config.room.STATUS_VIDEO)
                    room.setStatus(that.config.room.STATUS_VIDEO)
                    room.setVideo(true)
                    room.setTimer(that.config.room.WAIT_TIME_VIDEO_CONVERSATION)
                    that.sockets.to(name).emit('query', room.query())
                    that.setLastMatch(room, 'audio')
                    that.sockets.to('matches').emit('notification', that.getLastMatch())
                    // STATUS_VIDEO
                    setTimeout(function () {
                      if (room.getSocketIds().length > 1) {
                        that.logger.verbose('[TIMER] ' + name + ' ' + that.config.room.STATUS_VIDEO_SELECTION)
                        room.setStatus(that.config.room.STATUS_VIDEO_SELECTION)
                        room.setTimer(that.config.room.WAIT_TIME_SELECTION_SCREEN)
                        that.sockets.to(name).emit('query', room.query())
                        // STATUS_VIDEO_SELECTION
                        setTimeout(function () {
                          let socketIds = room.getSocketIds()
                          if (socketIds.length > 1) {
                            // STATUS_VIDEO_RESULTS
                            that.logger.verbose('[TIMER] ' + name + ' ' + that.config.room.STATUS_VIDEO_RESULTS)
                            room.setStatus(that.config.room.STATUS_VIDEO_RESULTS)
                            room.setTimer(0)
                            that.sockets.to(name).emit('query', room.query())
                            if (room.hasPositiveResultForStep('video')) {
                              let users = []
                              socketIds.forEach(function(socketId) {
                                let user = that.getUserBySocketId(socketId)
                                if (user) {
                                  users.push(user)
                                }
                              })
                              users.forEach(function(user) {
                                if ('relationship' === room.getType()) {
                                  users.forEach(function(subuser) {
                                    user.addRelationship(subuser)
                                    if (user.socket) {
                                      user.socket.emit('query', subuser.query(false))
                                    }
                                  })
                                } else {
                                  users.forEach(function(subuser) {
                                    user.addFriendship(subuser)
                                    if (user.socket) {
                                      user.socket.emit('query', subuser.query(false))
                                    }
                                  })
                                }
                                user.socket.emit('query', user.query(true))
                              })
                            }
                            that.setLastMatch(room, 'video')
                            that.sockets.to('matches').emit('notification', that.getLastMatch())
                          } else {
                            room.setStatus(that.config.room.STATUS_TERMINATED)
                            that.sockets.to(name).emit('query', room.query())
                          }
                        }, (that.config.room.WAIT_TIME_SELECTION_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
                      } else {
                        room.setStatus(that.config.room.STATUS_TERMINATED)
                        that.sockets.to(name).emit('query', room.query())
                      }
                    }, (that.config.room.WAIT_TIME_VIDEO_CONVERSATION + that.config.room.NETWORK_RESPONSE_DELAY))
                  } else {
                    room.setStatus(that.config.room.STATUS_TERMINATED)
                    that.sockets.to(name).emit('query', room.query())
                  }
                }, (that.config.room.WAIT_TIME_RESULT_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
              }
            } else {
              room.setStatus(that.config.room.STATUS_TERMINATED)
              that.sockets.to(name).emit('query', room.query())
            }
          }, (that.config.room.WAIT_TIME_SELECTION_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
        } else {
          room.setStatus(that.config.room.STATUS_TERMINATED)
          that.sockets.to(name).emit('query', room.query())
        }
      }, (this.config.room.WAIT_TIME_AUDIO_CONVERSATION + this.config.room.NETWORK_RESPONSE_DELAY))
    } catch (e) {
      this.logger.error('[TIMER] Error', e)
    }
  }

  bindSocketToPublicEvents(socket) {
    var that = this
    try {
      socket.on('error', function(data) { that.error(data, socket) })
      socket.on('login', function(data) { that.login(data, socket) })
      this.logger.verbose('Socket ' + socket.id + ' bound to public events')
    } catch (e) {
      this.logger.error('Socket ' + socket.id + ' not bound to public events ', e)
    }
  }

  bindSocketToPrivateEvents(socket) {
    var that = this
    try {
      socket.on('query', function(data) { that.query(data, socket) })
      socket.on('join', function(data, callback) { that.join(data, socket, callback) })
      socket.on('leave', function(data) { that.leave(socket) })
      socket.on('update', function(data) { that.update(data, socket) })
      socket.on('exchange', function(data) { that.exchange(data, socket) })
      socket.on('message', function(data) { that.message(data, socket) })
      socket.on('subscribe', function(data) { that.subscribe(data, socket) })
      socket.on('unsubscribe', function(data) { that.unsubscribe(data, socket) })
      this.logger.verbose('Socket ' + socket.id + ' bound to private events')
    } catch (e) {
      this.logger.error('Socket ' + socket.id + ' not bound to private events ', e)
    }
  }

  error(data, socket) {
    try {
      socket.emit('error', {event: 'error'})
    } catch (e) {
      this.logger.error('An unknown socket error has occured', e)
    }
  }

  login(data, socket) {
    try {
      let userId = User.generateId(data.data.email)
      let user = this.getUserById(userId)
      let newUser = false
      if (!user) {
        user = new User(this.config)
        newUser = true
      }

      let userData = {
        location: {
          locale   : data.data.locale,
          timezone : data.data.timezone,
          city     : data.data.city,
          country  : data.data.country,
          latitude : data.data.latitude,
          longitude: data.data.longitude
        }
      }
      if (newUser) {
        userData.email     = data.data.email
        userData.firstname = data.data.first_name
        userData.lastname  = data.data.last_name
        userData.providers = {
          facebook: {
            url    : data.data.link,
            picture: data.data.picture.data.url
          }
        }
        userData.profile = {
          nickname   : data.data.first_name,
          birthday   : data.data.birthday,
          orientation: 'O',
          friendship : 'A',
          agegroup   : 'no',
          picture    : data.data.picture.data.url,
          astrological: {
            chinese   : Astrology.calculateChinese(data.data.birthday),
            zodiac    : Astrology.calculateZodiac(data.data.birthday),
            birthstone: Astrology.calculateBirthstone(data.data.birthday),
            planet    : Astrology.calculatePlanet(data.data.birthday),
            element   : Astrology.calculateElement(data.data.birthday)
          }
        }
        if ('male' === data.data.gender) {
          userData.profile.gender = 'M'
        } else {
          userData.profile.gender = 'F'
        }
      }
      user.initialize(socket, this.source, userData)
      this.addSession(socket, user)
      this.addUser(user)
      this.bindSocketToPrivateEvents(socket)
      socket.emit('query', user.query(true))
      user.pushOfflineMessages()
      this.logger.info('[LOGIN] ' + user.getNickname() + '@' + user.getSocketId() + ' looking for ' + user.getAgeRange(), socket.id)
    } catch (e) {
      this.logger.error('[LOGIN] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  query(data, socket) {
    try {
      let info = null
      switch (data.type) {
        case 'user':
          if (!data.id) {
            info = this.getUserBySocketId(socket.id).query(true)
          } else {
            data.type = data.type + ':contact'
            if ('development' != this.config.environment.name) {
              info = this.getUserById(data.id).query(false)
            } else {
              info = this.getUserById(data.id).query(true)
            }
          }
          break
        case 'room':
          let user = this.getUserBySocketId(socket.id)
          if (user) {
            let room = this.getRoomByName(data.name)
            if (room) {
              info = room.query()
            } else {
              this.logger.error('[QUERY] ' + socket.id + ' does not have read access over ' + data.name)
            }
          }
          break
        default:
          break
      }
      if (info) {
        socket.emit('query', info)
        this.logger.verbose('[QUERY] ' + data.type)
      }
    } catch (e) {
      this.logger.error('[QUERY] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  join(data, socket, callback) {
    try {
      let user = this.getUserBySocketId(socket.id)
      if (user) {
        let roomName = null
        let room     = null
        switch(data.kind) {

          case 'rematch':
            roomName = data.name
            room     = this.getRoomByName(roomName)
            if (room) {
              socket.join(roomName)
              socket.room = roomName
              if (false === room.makeOffer) {
                room.makeOffer = true
              } else {
                callback(room.getSocketIds())
              }
            }
            break;

          default:
          case 'match':
            this.leave(socket)
            let ageGroup    = user.getAgeRange()
            let roomType    = data.type
            let roomStealth = data.stealth
            let name        = data.kind + '_' + roomType + '_' + socket.id + '/' + Math.floor((Math.random() * 999999))
            let genderMatch;
            if ('relationship' === roomType) {
              genderMatch = user.getWantedGenderDate()
            } else {
              genderMatch = user.getWantedGenderFriend()
            }
            // Cannot Join A User You Have Reported or Which Has Reported You - X Retries
            let incrRandom = false
            for (let i = 0; i < parseInt(this.config.room.FIND_BY_QUERY_RETRIES); i++) {
              let tempRoom = this.getNextRoomByQuery(genderMatch, ageGroup, roomType, roomStealth, incrRandom)
              if (tempRoom) {
                if (!user.hasBlocked(tempRoom.getInitiator())) {
                  let initiator = this.getUserById(tempRoom.getInitiator())
                  if (!initiator.hasBlocked(user.getId())) {
                    room = tempRoom
                    i    = parseInt(this.config.room.FIND_BY_QUERY_RETRIES)
                  }
                }
                incrRandom = true
              }
            }

            roomName = name
            let joined = true
            if (!room) {
              room = new Room(this.config)
              room.setInitiator(user.getId())
              let users = {}
              users[socket.id] = user.getId()
              room.initialize(this.sockets, {
                name       : name,
                genderMatch: user.getWantedGenderForRoom(roomType),
                ageGroup   : ageGroup,
                status     : this.config.room.STATUS_WAITING,
                stealth    : roomStealth,
                type       : roomType,
                timer      : 0,
                users      : users
              })
              joined = false
            } else {
              roomName = room.getName()
              room.data.users[socket.id] = user.getId()
            }

            socket.join(roomName)
            socket.room = roomName
            if (joined) {
              this.removeRoomFromQueue(room)
              this.logger.info('[JOIN] Joined Room ' + roomName + ' having ' + roomType + ' ' + genderMatch + '/' + ageGroup)
              callback(room.getSocketIds())
              this.runTimer(room)
            } else {
              this.logger.info('[JOIN] Created Room ' + roomName + ' having ' + roomType + ' ' + genderMatch + '/' + ageGroup)
              socket.emit('query', room.query())
              socket.emit('notification', this.getLastMatch())
              // Reported Users Have To Wait WAIT_TIME_PER_USER_REPORT millis per reports before room queryable
              let that = this
              setTimeout(function() {
                that.addRoom(room)
              }, (user.getTimesReported() * parseInt(that.config.user.WAIT_TIME_PER_USER_REPORT)))
            }
            break;
        }
      }
    } catch (e) {
      this.logger.error('[JOIN] ' + JSON.stringify(roomName) + ' ' + e)
    }
  }

  leave(socket) {
    try {
      let roomName = socket.room
      if (roomName) {
        socket.leave(roomName)
        socket.room = null
        let room = this.getRoomByName(roomName)
        if (room) {
          this.removeRoomFromAssoc(room)
          this.removeRoomFromQueue(room)
        }
        this.sockets.to(roomName).emit('leave', socket.id)
        this.logger.info('[LEAVE] Left Room ' + roomName)
      }
    } catch (e) {
      this.logger.error('[LEAVE] ' + e)
    }
  }

  exchange(data, socket) {
    try {
      data.from = socket.id
      var to = this.sockets.sockets.connected[data.to]
      if (to) {
        to.emit('exchange', data)
      }
    } catch (e) {
      this.logger.error('[EXCHANGE] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  message(data, socket) {
    try {
      let sender   = this.getUserBySocketId(socket.id)
      let receiver = this.getUserById(data.id)
      if (sender) {
        let message = {
          id  : sender.getId(),
          date: new Date().getTime(),
          text: data.message
        }
        if (receiver.socket) {
          receiver.socket.emit('message', message)
          this.logger.info('[MESSAGE] Message sent to connected user ' + receiver.getNickname())
        } else {
          receiver.addOfflineMessage(message)
          this.logger.info('[MESSAGE] Message stored for disconnected user ' + receiver.getNickname())
        }
      }
    } catch (e) {
      this.logger.error('[MESSAGE] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  update(data, socket) {
    try {
      let info = null
      switch (data.type) {
        case 'match':
            let room = this.getRoomByName(socket.room)
            if (room) {
              room.setResults(socket, data.data.step, data.data.feeling)
              info = room.getName() + ' at ' + data.data.step + ' with ' + data.data.feeling
            }
          break
        case 'profile':
          let user = this.getUserBySocketId(socket.id)
          if (user) {
            user.initialize(socket, this.source, data.data)
            user.socket.emit('query', user.query(true))
            info = 'of ' + user.getNickname()
          }
          break
        case 'report':
          let reporter = this.getUserBySocketId(socket.id)
          let reported = this.getUserById(data.id)
          if (reporter && reported) {
            reporter.blockUser(reported)
            if (false === reporter.hasTooManyReports()) {
              info = reported.getNickname() + ' and block requested by ' + reporter.getNickname()
            } else {
              info = reported.getNickname() + ' and block requested by ' + reporter.getNickname() + ' but omitted report as ' + reporter.getAmountOfReports() + ' is too high!'
            }
            reporter.reportUser(reported)
            reporter.socket.emit('query', reporter.query(true))
            try { reported.socket.emit('query', reporter.query(true)) } catch (e) {}
          }
          break
        case 'block':
          let blocker = this.getUserBySocketId(socket.id)
          let blocked = this.getUserById(data.id)
          if (blocker && blocked) {
            blocker.blockUser(blocked)
            info = blocked.getNickname() + ' requested by ' + blocker.getNickname()
            blocker.socket.emit('query', blocker.query(true))
            try { blocked.socket.emit('query', blocked.query(true)) } catch (e) {}
          }
          break
        default:
          break
      }
      if (info) {
        this.logger.verbose('[UPDATE] ' + data.type + ' ' + info)
      }
    } catch (e) {
      this.logger.error('[UPDATE] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  subscribe(data, socket) {
    try {
      socket.join(data.room)
    } catch (e) {
      this.logger.error('An unknown socket error has occured', e)
    }
  }

  unsubscribe(data, socket) {
    try {
      socket.leave(data.room)
    } catch (e) {
      this.logger.error('An unknown socket error has occured', e)
    }
  }

}

module.exports = Api