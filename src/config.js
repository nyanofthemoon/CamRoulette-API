'use strict'

module.exports = {

  application: {
    secrets: [
      process.env.APPLICATION_SECRET_FREE || 'dr7p4Kaja53#-xaY7remuthU7es*ucAjW_EcenUh-t@#SpE3e_uBuswef-a*atuSbrEW#e2aprEx2pusPubra_ru@#eruWrAp3n2HE$rA#2+uwu2eStUqu2r2z$vAVUg5*zeqU4wepr+kaT=aWr8+reh5phaduVuQaFr6P5XacrarUdR2vE+w6CHutHusUs4#exa8ADed5@est7de6EhapHej4pr*4Ra!E6re7raq@wrus?f=e#aqAZufrEwru?R',
      process.env.APPLICATION_SECRET_PAID || '5-$edru#H*8U#rutRus!uSwaxU#44apaC@E54sP+s-uC*+U73XUT=UtH8pHuDepR8u5=s?E3hUkeSP-4Usp@stAjA2enURa$6AM!kusWe+weN7PhahuT#aphaBa_taw?y=buV8xas8E3hApuW-ePrewek!gAyEcaSwE#aPr$vaC5CHAwuwr+haChESUS=E*+truphuc3=Ucredr@spujeCreMe-recesSpUcraxuheJ+jucES8aqU5RaphEka2ez'
    ]
  },

  room: {
    STATUS_WAITING              : 'waiting',
    STATUS_AUDIO                : 'audio',
    STATUS_AUDIO_SELECTION      : 'selection_audio',
    STATUS_AUDIO_RESULTS        : 'results_audio',
    STATUS_VIDEO                : 'video',
    STATUS_VIDEO_SELECTION      : 'selection_video',
    STATUS_VIDEO_RESULTS        : 'results_video',
    STATUS_TERMINATED           : 'terminated',
    WAIT_TIME_AUDIO_CONVERSATION: parseInt(process.env.WAIT_TIME_AUDIO_CONVERSATION) || 600000,
    WAIT_TIME_SELECTION_SCREEN  : parseInt(process.env.WAIT_TIME_SELECTION_SCREEN)   || 10000,
    WAIT_TIME_RESULT_SCREEN     : parseInt(process.env.WAIT_TIME_RESULT_SCREEN)      || 5000,
    WAIT_TIME_VIDEO_CONVERSATION: parseInt(process.env.WAIT_TIME_VIDEO_CONVERSATION) || 180000,
    NETWORK_RESPONSE_DELAY      : parseInt(process.env.NETWORK_RESPONSE_DELAY)       || 1000,
    FIND_BY_QUERY_RETRIES       : 5
  },

  environment: {
    name   : process.env.NODE_ENV || 'development',
    port   : process.env.PORT     || 8888,
    verbose: process.env.VERBOSE  || true
  },

  bot: {
    email  : process.env.PLUSH_BOT_EMAIL   || 'paule.lepage@gmail.com',
    message: process.env.PLUSH_BOT_MESSAGE || 'Hi. Thanks for trying Plush! We are in Beta right now. If you notice anything strange, please let me know. :)',
  },

  user: {
    salt: process.env.USER_SALT || '&!perd3rder5+%',
    WAIT_TIME_PER_USER_REPORT: parseInt(process.env.WAIT_TIME_PER_USER_REPORT) || 1500,
    MAX_SOCKET_CONNECTIONS   : parseInt(process.env.MAX_SOCKET_CONNECTIONS)    || -1
  },

  redis: {
    url    : process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    options: {}
  },

  worker: {
    save: {
      interval: parseInt(process.env.WORKER_SAVE_INTERVAL) || (5 * (60 * 1000)) // Runs every 5 minutes
    }
  }

}