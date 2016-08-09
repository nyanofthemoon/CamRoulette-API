'use strict'

let Logger = require('./logger')
let Redis = require('./redis')
let Room = require('./room')
let User = require('./user')

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
        'M': {
          '18-29': {},
          '30-49': {},
          '50-65': {}
        },
        'MM': {
          '18-29': {},
          '30-49': {},
          '50-65': {}
        },
        'F': {
          '18-29': {},
          '30-49': {},
          '50-65': {}
        },
        'FF': {
          '18-29': {},
          '30-49': {},
          '50-65': {}
        }
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
    this.data.assoc[name] = {
      genderMatch: genderMatch,
      ageGroup   : ageGroup
    }
    this.data.queue[genderMatch][ageGroup][name] = room
  }

  getRoomByName(name) {
    let data = this.data.assoc[name]
    if (data) {
      return this.data.queue[data.genderMatch][data.ageGroup][name] || null
    }
    return null
  }

  removeRoomFromQueue(room) {
    let name = room.getName()
    let genderMatch = room.getGenderMatch()
    let ageGroup = room.getAgeGroup()
    delete(this.data.queue[genderMatch][ageGroup][name])
  }

  removeRoomFromAssoc(room) {
    let name = room.getName()
    delete(this.data.assoc[name])
  }

  getRandomRoomByQuery(genderMatch, ageGroup) {
    let keys = Object.keys(this.data.queue[genderMatch][ageGroup])
    let key  = Math.floor(keys.length * Math.random())
    return this.data.queue[genderMatch][ageGroup][keys[key]] || null
  }

  getUserById(id) {
    return this.data.users[id] || null
  }

  getUserBySocketId(id) {
    return this.data.users[this.data.sessions[id]] || null
  }

  runTimer(room) {
    let that = this
    let name = room.getName()

    console.log('aaaa')

    let clonedRoom = JSON.parse(JSON.stringify(room))

    console.log(clonedRoom)


    // STATUS_AUDIO
    this.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_AUDIO)
    clonedRoom.setStatus(this.config.room.STATUS_AUDIO)
    clonedRoom.setVideo(false)
    this.sockets.to(name).emit('query', clonedRoom.query())
    setTimeout(function() {
      that.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_AUDIO_SELECTION)
      clonedRoom.setStatus(that.config.room.STATUS_AUDIO_SELECTION)
      that.sockets.to(name).emit('query', clonedRoom.query())
      // STATUS_AUDIO_SELECTION
      setTimeout(function() {
        that.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_AUDIO_RESULTS)
        clonedRoom.setStatus(that.config.room.STATUS_AUDIO_RESULTS)
        that.sockets.to(name).emit('query', clonedRoom.query())
        // STATUS_AUDIO_RESULTS
        setTimeout(function() {
          that.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_VIDEO)
          room.setStatus(that.config.room.STATUS_VIDEO)
          room.setVideo(true)
          that.sockets.to(name).emit('query', room.query())
          // STATUS_VIDEO
          setTimeout(function() {
            that.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_VIDEO_SELECTION)
            room.setStatus(that.config.room.STATUS_VIDEO_SELECTION)
            that.sockets.to(name).emit('query', room.query())
            // STATUS_VIDEO_SELECTION
            setTimeout(function() {
              // STATUS_VIDEO_RESULTS
              that.logger.verbose('[TIMER] ' + name + ' ' + this.config.room.STATUS_VIDEO_RESULTS)
              room.setStatus(that.config.room.STATUS_VIDEO_RESULTS)
              that.sockets.to(name).emit('query', room.query())
            }, (that.config.room.WAIT_TIME_SELECTION_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
          }, (that.config.room.WAIT_TIME_VIDEO_CONVERSATION + that.config.room.NETWORK_RESPONSE_DELAY))
        }, (that.config.room.WAIT_TIME_RESULT_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
      }, (that.config.room.WAIT_TIME_SELECTION_SCREEN + that.config.room.NETWORK_RESPONSE_DELAY))
    }, (this.config.room.WAIT_TIME_AUDIO_CONVERSATION + this.config.room.NETWORK_RESPONSE_DELAY))
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
      socket.on('exchange', function(data) { that.exchange(data, socket) })
      socket.on('message', function(data) { that.message(data, socket) })
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
      let user = this.getUserById(data.data.email)
      if (!user) {
        user = new User(this.config)
      }

      let gender;
      if ('male' === data.data.gender) {
        gender = 'M'
      } else {
        gender = 'F'
      }
      let userData = {
        email: data.data.email,
        gender: gender,
        orientation: 'straight',
        birthday: data.data.birthday,
        firstName: data.data.first_name,
        lastName: data.data.last_name,
        locale: data.data.locale,
        timezone: data.data.timezone,
        facebookProfile: data.data.link,
        facebookPicture: data.data.picture.data.url
      }

      user.initialize(socket, this.source, userData)
      this.addSession(socket, user)
      this.addUser(user)
      this.bindSocketToPrivateEvents(socket)
      socket.emit('query', user.query())
      this.logger.info('[LOGIN] ' + user.getFirstName() + '@' + user.getSocketId() + ' looking for ' + user.getWantedGender() + ':' + user.getAgeRange(), socket.id)
    } catch (e) {
      this.logger.error('[LOGIN] ' + JSON.stringify(data) + ' ' + e)
    }
  }

  query(data, socket) {
    try {
      let info = null
      switch (data.type) {
        case 'user':
          info = this.getUserBySocketId(socket.id).query()
          break
        case 'room':
          let user = this.getUserBySocketId(socket.id)
          if (user) {
            let room = this.getRoomByName(data.name)
            if (room && room.hasUser(user)) {
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
      this.leave(socket)
      let user = this.getUserBySocketId(socket.id)
      if (user) {
        let roomName = null
        let room = null
        switch(data.type) {

          case 'video':
            roomName = data.name
            room = this.getRoomByName(roomName)
            if (room) {
              socket.join(roomName)
              socket.room = roomName
              this.logger.info('[JOIN] Re-joined Room ' + roomName)
              callback(room.getSocketIds())
            }
            break;

          case 'audio':
            let name = data.type + '_' + socket.id + '/' + Math.floor((Math.random() * 999999))
            let genderMatch = user.getWantedGender()
            let ageGroup = user.getAgeRange()

            //@TODO Remove me. This is for testing with just 2 devices//
            genderMatch = 'M'
            ageGroup    = '18-29'
            ////////////////////////////////////////////////////////////

            room = this.getRandomRoomByQuery(genderMatch, ageGroup)
            roomName = name
            let joined = true
            if (!room) {
              genderMatch = user.getGender()

              //@TODO Remove me. This is for testing with just 2 devices//
              genderMatch = 'M'
              ////////////////////////////////////////////////////////////

              room = new Room(this.config)
              room.initialize(this.sockets, {
                name       : name,
                genderMatch: genderMatch,
                ageGroup   : ageGroup
              })
              joined = false
            } else {
              roomName = room.getName()
            }
            socket.join(roomName)
            socket.room = roomName
            if (joined) {
              this.removeRoomFromQueue(room)
              this.runTimer(room)
              this.logger.info('[JOIN] Joined Room ' + roomName + ' having ' + genderMatch + '/' + ageGroup)
              callback(room.getSocketIds())
            } else {
              this.addRoom(room)
              this.logger.info('[JOIN] Created Room ' + roomName + ' having ' + genderMatch + '/' + ageGroup)
            }
            break;

          default:
            break;
        }
      }
    } catch (e) {
      this.logger.error('[JOIN] ' + JSON.stringify(roomName) + ' ' + e)
    }
  }

  leave(socket) {
    try {
      let roomName = ''
      if (socket.room) {
        roomName = socket.room
        let room = this.getRoomByName(socket.room)
        if (room) {
          this.removeRoomFromAssoc(room)
          this.removeRoomFromQueue(room)
        }
        this.sockets.to(roomName).emit('leave', socket.id)
        socket.leave(roomName)
        socket.room = null;
        this.logger.info('[LEAVE] Left Room ' + roomName)
      }
    } catch (e) {
      this.logger.error('[LEAVE] ' + JSON.stringify(roomName) + ' ' + e)
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
      let user = this.getUserBySocketId(socket.id)
      if (user) {
        socket.to(socket.room).emit('message', {
          name   : user.getFirstName(),
          message: data
        })
      }
    } catch (e) {
      this.logger.error('[MESSAGE] ' + JSON.stringify(data) + ' ' + e)
    }
  }

}

module.exports = Api