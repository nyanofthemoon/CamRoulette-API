# CamRoulette-API

# Installation

### Development

* `npm install`
* `redis-server --port 6379`
* `npm run dev` runs the development environment using webpack-dev-server

###### Redis Recipes

* Get all user data ```HGETALL user```
* Get all user ids ```HKEYS user```
* Get one user ```HGET user <email>```
* Delete one user ```HDEL user <email>```
* Delete all users ```DEL user```

### Deployment

* `npm run dist` builds the distribution package
* `npm run start` runs the distribution package

# Requests And Responses

### Login User

###### Request
```js
socket.emit("login", {
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
