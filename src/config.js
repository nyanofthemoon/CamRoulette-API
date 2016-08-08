'use strict'

module.exports = {

  environment: {
    name: process.env.NODE_ENV   || 'development',
    port: process.env.PORT       || 8888,
    verbose: process.env.VERBOSE || true
  },

  user: {
    salt: process.env.USER_SALT || '&!perd3rder5+%'
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    options: {}
  }

}