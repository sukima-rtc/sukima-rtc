# Entrance Control Server - Sukima RTC

The API server to manage rooms and entrance for [Sukima RTC].

## 💿 Installation

```
$ git clone https://github.com/sukima-rtc/entrance-controller.git
$ cd entrance-controller
$ npm install --production
```

### Requirements

- [Node.js] 6.0.0 or later.
- [npm] which is bundled in [Node.js].

## 📖 Usage

```
$ npm start
```

### Environment Variables

- **PORT** (default: `80`) is the port number of this sever.
- **CLIENT_ORIGIN** (default: disallow) is an URL to allow CORS (Cross-Origin Resource Sharing).
- **ROOM_BACKEND** (default: `none`) is the method to save room information permanently.
    - `none` does not save information permanently.
    - `fs <root>` saves information to local file system. E.g., `"fs /tmp/sukima-rtc/rooms"`
    - `s3 <accessKeyId> <secretAccessKey> <region> <bucket> <root>` saves information to AWS S3. E.g., `"s3 adfeer abdfab ap-northeast-1 sukima-rtc rooms"`

## ✨ API

### 🌏 GET /rooms

Gets all rooms that there are one or more players.

**Note:** Rooms where nobody is, gets hidden automatically in the list. However, clients still know the hidden rooms if the client had been joining to the rooms before, then players can join to the hidden rooms from such clients.

This API returns JSON (`application/json`) or event streams (`text/event-stream`).
If you select event streams, it notifies the current rooms with a `ready` event, then the stream notifies events of `open`, `close`, and `update`.

Currently, this API does not have pagination feature.

### 🌏 POST /rooms

Creates a new room.

The body of requests must be a JSON object which has the following properties.

- `name` (`string`)
- `description` (`string`)
- `password` (`string`)

This API returns a JSON object that this API created.

- `id` (`string`)
- `name` (`string`)
- `description` (`string`)
- `players` (`number`)

### 🌏 GET /rooms/:id

Gets the specified room.

This API returns a JSON object which has the following properties.

- `id` (`string`)
- `name` (`string`)
- `description` (`string`)
- `players` (`number`)

### 🔒 PUT /rooms/:id

Updates the specified room.

This API requires `Authorization` HTTP header.
The header must be `Bearer` scheme with an session token.
The session token can be get by `GET /rooms/:id/signals` API.

The body of requests must be a JSON object which has the following properties.

- `name` (`string`)
- `description` (`string`)
- `password` (`string`)

This API returns no content.

### 🔒 GET /rooms/:id/signals

Opens a signaling channel for [WebRTC].

This API requires `name` and `password` query parameter.
The `password` is the room's password.

This API returns event streams to negociate peer-to-peer connections.

> TODO: write details of events.

### 🔒 PUT /rooms/:id/signals

Puts a negociation event to signaling channels.

This API requires `Authorization` HTTP header.
The header must be `Bearer` scheme with an session token.
The session token can be get by `GET /rooms/:id/signals` API.

> TODO: write details of the request body.

## 📰 Changelog

- [GitHub Releases](https://github.com/sukima-rtc/entrance-controller/releases)

## 💪 Contributing

Welcome contributing!

Please use GitHub's issues/PRs.

[Sukima RTC]: https://github.com/sukima-rtc/sukima-rtc
[WebRTC]: https://www.w3.org/TR/webrtc/
[Node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
