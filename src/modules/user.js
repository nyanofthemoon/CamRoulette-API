'use strict';

let Logger = require('./logger');

class User {

  constructor(config) {
    this.logger = new Logger('USER', config);
    this.socket = null;
    this.source = null;
    //@TODO Format from data passed using facebook auth
    this.data = {
      email: null
    };
  }

  initialize(socket, source, data) {
    this.socket = socket;
    this.source = source;
    let that    = this;
    Object.keys(data).forEach(function (key) {
      that.data[key] = data[key];
    });
  }

  // Returns a promise
  static findOne(source, id) {
    return source.hgetAsync('user', id);
  }

  // Returns a promise
  static findAll(source) {
    return source.hgetallAsync('user');
  }

  // Returns a promise
  save() {
    return this.source.hsetAsync('user', this.getId(), JSON.stringify(this.data));
  }

  getId() {
    return this.data.email;
  }

  getEmail() {
    return this.data.email;
  }

  query() {
    var struct = {
      'type': 'user',
      'data': {
        'email': this.getEmail()
      }
    };

    return struct;
  }

};

module.exports = User;