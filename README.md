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
    "email": "nyan@fake.net"
  }
}
```

### Join User

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
