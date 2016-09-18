'use strict'

let Logger = require('./../modules/logger')  

class Save {

  constructor(config, store) {
    this.logger   = new Logger('WORKER [SAVE]', config)
    this.store    = store
    this.interval = config.worker.save.interval
  }

  start() {
    this.logger.info('Initialized. Runs every ' + (this.interval/1000) + ' seconds')
    var self = this
    setInterval(function () {
      self._run.call(self)
    }, this.interval)
  }

  _run() {
    this.logger.info('Started Task')
    this.store.publish('system', JSON.stringify({type: 'save-users'}))
    this.logger.info('Completed Task')
  }

}


module.exports = Save