# CamRoulette-API

# Installation

### Development

A webserver in development mode exists at `http://localhost:8888/` to test join/exchange functionality.

* `npm install`
* `redis-server --port 6379`
* `npm run dev` runs the development environment using webpack-dev-server

###### Redis Recipes

* Get all user data ```HGETALL user```
* Get all user emails ```HKEYS user```
* Get one user ```HGET user <email>```
* Delete one user ```HDEL user <email>```
* Delete all users ```DEL user```

### Deployment

* `npm run dist` builds the distribution package
* `npm run start` runs the distribution package

# Requests And Responses

### Login User

Log in user to system using websockets after mobile app completes Facebook authentication and Graph request to /me for the required fields.

###### Request
```js
socket.emit("login", {
  "data": {
    'email"     : "nyan@fake.net",
    'gender"    : "female",
    "first_name": "Nyan",
    "last_name" : "Moon",
    "locale"    : "-4",
    "timezone"  : "en_US",
    "link"      : "https://",
    "picture"   : {
      "data": {
        "url": "https://"
      }
    }
  }
})
```

###### Response
```js
socket.on("query", callback)
```
```json
{
  "type": "user",
  "data": {
    "email": "nyan@fake.net"
  }
}
```

### Query User

Query user information from system.

###### Request
```js
socket.emit("query", {
  "type": "user"
})
```
###### Response
```js
socket.on("query", callback)
```
```json
{
  "type": "user",
  "data": {
    "email"          : "nyan@fake.net",
    "gender"         : "female",
    "firstName"      : "Nyan",
    "lastName"       : "Cat",
    "facebookProfile": "https://",
    "facebookPicture": "https://",
    "locale"         : "en_US",
    "timezone"       : -4,
    "contacts"       : []
  }
}
```

### Join Room

User is ready to start a conversation. Will either join another waiting user in the pool or wait until someone else is ready.

###### Request
```js
socket.emit("join", {
})
```
###### Response
```js
socket.on("exchange", callback)
```
```json
{
}
```

### Leave Room

Will leave last room joined.

###### Request
```js
socket.emit("leave", {
})
```

### Query Room

Query user information from system.

###### Request
```js
socket.emit("query", {
  "name": "room_/#xSQ0nZIViteIAgPgAAAD"
})
```
###### Response
```js
socket.on("query", callback)
```
```json
{
  "type": "room",
  "data": {
    "name"  : "room_/#xSQ0nZIViteIAgPgAAAD",
    "status": "inactive|waiting|active",
    "round" : 1
  }
}
```

### User Match Choice

After either the audio or video step of a meetup, users must choose to either continue or end the process.
A report flag is also available for flagging abusive behaviors.

###### Request
```js
socket.emit("update", {
  "type": "match",
  "data: {
    "step"  : "audio|video",
    "action": "yes|no|report"
  }
})
```