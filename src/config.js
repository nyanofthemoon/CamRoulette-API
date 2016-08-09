'use strict'

module.exports = {

  application: {
    secrets: [
      process.env.APPLICATION_SECRET_FREE || 'dr7p4Kaja53#-xaY7remuthU7es*ucAjW_EcenUh-t@#SpE3e_uBuswef-a*atuSbrEW#e2aprEx2pusPubra_ru@#eruWrAp3n2HE$rA#2+uwu2eStUqu2r2z$vAVUg5*zeqU4wepr+kaT=aWr8+reh5phaduVuQaFr6P5XacrarUdR2vE+w6CHutHusUs4#exa8ADed5@est7de6EhapHej4pr*4Ra!E6re7raq@wrus?f=e#aqAZufrEwru?R',
      process.env.APPLICATION_SECRET_PAID || '5-$edru#H*8U#rutRus!uSwaxU#44apaC@E54sP+s-uC*+U73XUT=UtH8pHuDepR8u5=s?E3hUkeSP-4Usp@stAjA2enURa$6AM!kusWe+weN7PhahuT#aphaBa_taw?y=buV8xas8E3hApuW-ePrewek!gAyEcaSwE#aPr$vaC5CHAwuwr+haChESUS=E*+truphuc3=Ucredr@spujeCreMe-recesSpUcraxuheJ+jucES8aqU5RaphEka2ez'
    ]
  },

  environment: {
    name   : process.env.NODE_ENV   || 'development',
    port   : process.env.PORT       || 8888,
    verbose: process.env.VERBOSE || true
  },

  user: {
    salt: process.env.USER_SALT || '&!perd3rder5+%'
  },

  redis: {
    url    : process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    options: {}
  }

}