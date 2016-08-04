'use strict';

let Logger = require('./logger');
let Redis  = require('./redis');
let User   = require('./user');

class Api {

  constructor(config) {
    this.logger  = new Logger('API', config);
    this.config  = config;
    this.sockets = null;
    this.source  = null;
    this.workers = {};
    this.data    = {
      sessions: {},
      users: {}
    };
  }

  static initialize(io, config) {
    return new Promise(function (resolve, reject) {
      let api = new Api(config);
      api.sockets = io;
      new Redis(config).initialize()
        .then(function (clientOne) {

          // Subscribe to Events
          clientOne.subscribe('system');

          // Handle Event Messages
          clientOne.on('message', function (channel, message) {
            try {
              message = JSON.parse(message);
              switch (channel) {
                case 'system':
                  switch (message.type) {
                    case 'save-users':
                      for (let key in api.data.users) {
                        api.data.users[key].save();
                      }
                      break;
                    case 'disconnect-users':
                      for (let key in api.data.users) {
                        let userSocket = api.data.users[key].socket;
                        userSocket.disconnect(true);
                        api.removeSession(userSocket);
                      }
                      break;
                    default:
                      break;
                  }
                default:
                  break;
              }
              api.logger.info('Notification received from ' + channel, message);
            } catch (e) {
              api.logger.error('Notification error from ' + channel + ' with ' + message, e);
            }
          });

          // Initialize Data
          new Redis(config).initialize()
            .then(function (clientTwo) {
              api.source = clientTwo;
              User.findAll(api.source)
                .then(function (users) {
                  if (users) {
                    Object.keys(users).forEach(function (key) {
                      let user = new User(config);
                      user.initialize(null, api.source, JSON.parse(users[key]));
                      api.data.users[user.getId()] = user;
                    });
                  }
                  resolve(api);
                }).catch(function (e) {
                reject(e);
              });

            }).catch(function (e) {
            reject(e);
          });

        }).catch(function (e) {
        reject(e);
      });
    });
  }

  addSession(socket, user) {
    this.data.sessions[socket.id] = user.getId();
  };

  removeSession(socket) {
    delete(this.data.sessions[socket.id]);
  }

  addUser(user) {
    this.data.users[user.getId()] = user;
  };

  getUsers() {
    return this.data.users || {};
  };

  getUserById(id) {
    return this.data.users[id] || null;
  };

  getUserBySocketId(id) {
    return this.data.users[this.data.sessions[id]] || null;
  }

  bindSocketToPublicEvents(socket) {
    var that = this;
    try {
      socket.on('error', function(data) { that.error(data, socket); });
      socket.on('login', function(data) { that.login(data, socket); });
      this.logger.verbose('Socket ' + socket.id + ' bound to public events');
    } catch (e) {
      this.logger.error('Socket ' + socket.id + ' not bound to public events ', e);
    }
  }

  bindSocketToPrivateEvents(socket) {
    var that = this;
    try {
      socket.on('query', function(data) { that.query(data, socket); });
      this.logger.verbose('Socket ' + socket.id + ' bound to private events');
    } catch (e) {
      this.logger.error('Socket ' + socket.id + ' not bound to private events ', e);
    }
  }

  error(data, socket) {
    try {
      socket.emit('error', {event: 'error'});
    } catch (e) {
      this.logger.error('An unknown socket error has occured', e);
    }
  }

  login(data, socket) {
    let user = this.getUserById(data.data.email);
    if (!user) {
      user = new User(this.config);
    }
    let userData = {
      email: data.data.email,
      gender: data.data.gender,
      firstName: data.data.first_name,
      lastName:data.data.last_name,
      locale: data.data.locale,
      timezone: data.data.timezone,
      facebookProfile: data.data.link,
      facebookPicture: data.data.picture.data.url
    };
    user.initialize(socket, this.source, userData);
    this.addSession(socket, user);
    this.addUser(user);
    this.bindSocketToPrivateEvents(socket);
    this.logger.info('User Authenticated: ' + user.getId(), socket.id);
    socket.emit('query', user.query());
  }

  query(data, socket) {
    try {
      let info = null;
      switch (data.type) {
        case 'user':
          info = this.getUserBySocketId(socket.id).query();
          break;
        default:
          break;
      }
      if (info) {
        socket.emit('query', info);
        this.logger.verbose('[QUERY] ' + data.type);
      }
    } catch (e) {
      this.logger.error('[QUERY] ' + JSON.stringify(info) + ' ' + e);
    }
  }

}
;

module.exports = Api;