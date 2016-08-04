'use strict'

const CONFIG = require('./../config')

let Redis = require('./../modules/redis')

let Save = require('./save')

new Redis(CONFIG).initialize()
  .then(function (client) {

    // Save Data
    new Save(CONFIG, client).start()

  })