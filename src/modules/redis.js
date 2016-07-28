'use strict';

let Bluebird = require('bluebird');
let redis    = require('redis');
let Logger   = require('./../modules/logger');

Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);

class Redis {

    constructor(config) {
        this.logger  = new Logger('REDIS', config);
        this.url     = config.redis.url;
        this.options = config.redis.options;
    }

    initialize() {
        var that = this;
        return new Promise(function(resolve, reject) {
            try {
                let client = redis.createClient(that.url, that.options);
                that.logger.info('Connection established');
                resolve(client);
            } catch (e) {
                that.logger.error('Could not establish connection', e);
                reject(e);
            }
        });
    }

};

module.exports = Redis;