'use strict'

let Logger = require('./../modules/logger')

class Save {

  constructor(config, store) {
    this.logger = new Logger('WORKER [SAVE]', config)
    this.store = store
    this.interval = 5000//30 * (60 * 1000) // Runs every 30 minutes
  }

  start() {
    var self = this
    setInterval(function () {
      self._run.call(self)
    }, this.interval)
  }

  _run() {
    this.store.publish('system', JSON.stringify({type: 'save-users'}))
  }

}


module.exports = Save