/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const EventEmitter = require("events")
const HttpError = require("./http-error")
const IdGenerator = require("./id-generator")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Heartheat controller.
 *
 * @private
 */
const Heartbeat = new class Heartbeat {
    /**
     * Creates a heartbeat controller instance.
     */
    constructor() {
        this.sockets = new Map()
        this.interval = 30000
        this.timer = 0
        this.beat = () => {
            for (const socket of this.sockets.values()) {
                socket.write(":\n")
            }
            this.timer = setTimeout(this.beat, this.interval)
        }
    }

    /**
     * Registers a socket to send heartbeat.
     *
     * @param {string} id - The ID of the socket.
     * @param {external:express.Response} socket - The socket to register.
     * @returns {void}
     */
    registerSocket(id, socket) {
        this.sockets.set(id, socket)

        if (this.timer === 0) {
            this.timer = setTimeout(this.beat, this.interval)
        }
    }

    /**
     * Unegisters a socket.
     *
     * @param {string} id - The ID of the socket.
     * @returns {void}
     */
    unregisterSocket(id) {
        this.sockets.delete(id)

        if (this.sockets.size === 0 && this.timer !== 0) {
            clearTimeout(this.timer)
            this.timer = 0
        }
    }
}()

/**
 * Ring buffer to store event history.
 *
 * @private
 */
class EventHistory {
    /**
     * Creates a EventHistory instance.
     *
     * @param {number} capacity - The size of this ring buffer.
     */
    constructor(capacity) {
        this.items = Object.preventExtensions(new Array(capacity).fill(null))
        this.first = 0
        this.last = 0
    }

    /**
     * The size of this history.
     * @type {number}
     */
    get size() {
        const {items, first, last} = this
        return (first <= last) ? last - first : items.length
    }

    /**
     * The capacity of this ring buffer.
     * @type {number}
     */
    get capacity() {
        return this.items.length
    }

    /**
     * Gets the value of the given index.
     *
     * @param {number} index - The index to get.
     * @returns {object} The history item.
     */
    at(index) {
        if (index < 0 || index >= this.size) {
            return undefined
        }
        return this.items[(this.first + index) % this.items.length]
    }

    /**
     * Makes the next index.
     *
     * @param {number} index - The current index to make next.
     * @returns {number} The next index.
     * @private
     */
    _nextIndex(index) {
        return (index === this.capacity - 1) ? 0 : index + 1
    }

    /**
     * Adds the new event item.
     * If it's overflow from this ring buffer, this overwrites the oldest item.
     *
     * @param {object} item - The event item to add.
     * @returns {void}
     */
    add(item) {
        this.last = this._nextIndex(this.last)
        if (this.first === this.last) {
            this.first = this._nextIndex(this.first)
        }
        this.items[this.last] = item
    }

    /**
     * Clear this history.
     *
     * @returns {void}
     */
    clear() {
        this.first = this.last = 0
    }

    /**
     * Searches the start index to iterate items which are newer than the given ID.
     *
     * @param {string} eventId - The ID to search.
     * @returns {number} The start index.
     * @private
     */
    _startOf(eventId) {
        let l = 0
        let r = this.size - 1

        while (l <= r) {
            const m = (l + r) / 2 | 0
            const a = this.at(m)

            if (a.eventId > eventId) {
                r = m - 1
                continue
            }
            if (a.eventId < eventId) {
                l = m + 1
                continue
            }

            return m + 1
        }

        return r + 1
    }

    /**
     * Iterates items which are newer than the given ID.
     *
     * @param {string} eventId - The ID to iterate.
     * @returns {Iterator<object>} The iterator which iterates items which are newer than the ID.
     */
    * after(eventId) {
        for (let i = this._startOf(eventId), size = this.size; i < size; ++i) {
            yield this.at(i)
        }
    }
}

/**
 * Gets or creates ID.
 *
 * @param {string|undefined} lastEventId - `Last-Event-ID` HTTP header to get ID.
 * @param {string|undefined} peerId - `peerId` query parameter to get ID.
 * @returns {string} Gotten or created ID.
 */
function getId(lastEventId, peerId) {
    if (lastEventId != null) {
        const id = lastEventId.slice(-IdGenerator.length)
        if (!IdGenerator.isValidId(id)) {
            throw HttpError.new(400, "Invalid Last-Event-ID")
        }
        return id
    }
    if (peerId != null) {
        if (!IdGenerator.isValidId(peerId)) {
            throw HttpError.new(400, "Invalid peerId")
        }
        return peerId
    }

    return IdGenerator.nextId()
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The handler of SSE.
 */
class ServerSentEvents extends EventEmitter {
    /**
     * Creates a new ServerSentEvents object.
     *
     * @param {object} options - The option object.
     * @param {number} [options.historyLimit=1024] - The capacity of saving past events.
     */
    constructor({historyLimit = 1024} = {}) {
        super()
        this.sockets = new Map()
        this.history = new EventHistory(historyLimit)
    }

    /**
     * Creates a new ServerSentEvents object.
     *
     * @param {object} options - The option object.
     * @param {number} heartheats - The interval of heartbeats in milliseconds.
     * @returns {ServerSentEvents} Created object.
     */
    static new() {
        return new ServerSentEvents()
    }

    /**
     * The interval in milliseconds of heartbeats.
     * @type {number}
     */
    static get heartbeatInterval() {
        return Heartbeat.interval
    }
    static set heartbeatInterval(value) {  //eslint-disable-line require-jsdoc
        Heartbeat.interval = value
    }

    /**
     * Closes all connections.
     *
     * Note: those connections may retry to connect because those status codes are 200.
     *
     * @returns {void}
     */
    close() {
        for (const [id, socket] of this.sockets.entries()) {
            socket.end()
            Heartbeat.unregisterSocket(id)
        }
        this.sockets.clear()
    }

    /**
     * Counts the sockets in this event publisher.
     *
     * @type {number}
     */
    get size() {
        return this.sockets.size
    }

    /**
     * Checks the socket of the given ID is subscribing this event publisher or not.
     * If the ID was omitted, this checks there are one or more sockets in this event publisher.
     *
     * @param {string} [id=null] - The ID of the socket.
     * @returns {boolean} `true` if the socket of the given ID is subscribing this event publisher.
     */
    hasSocket(id = null) {
        return id == null ? this.sockets.size > 0 : this.sockets.has(id)
    }

    /**
     * Registers the given socket to this event publisher.
     *
     * @param {external:express.Response} socket - The socket to register.
     * @param {object} [options] - The options.
     * @param {string|null} [options.lastEventId] - The Last-Event-ID field's value.
     * @param {function} [options.ready] - The function to modify the argument of ready events.
     * @returns {string} The ID of the socket.
     */
    registerSocket(socket, {lastEventId = null, peerId = null, ready = (x) => x} = {}) {
        const id = getId(lastEventId, peerId)

        socket.on("close", () => {
            Heartbeat.unregisterSocket(id)
            this.sockets.delete(id)
            this._emitUnregister(id)
        })
        socket.on("error", () => {
            Heartbeat.unregisterSocket(id)
            this.sockets.delete(id)
            this._emitUnregister(id)
        })
        socket.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        })

        this.sockets.set(id, socket)
        Heartbeat.registerSocket(id, socket)

        if (lastEventId == null) {
            // Send the ready event.
            const eventId = IdGenerator.nextId()
            const eventData = JSON.stringify(ready({type: "ready", peerId: id}))

            socket.write(`id:${eventId}${id}\ndata:${eventData}\n\n`)
        }
        else {
            // Send newer events than lastEventId.
            const events = this.history.after(lastEventId.slice(12))
            for (const {eventId, eventData, senderId, targetId} of events) {
                if (senderId !== id && (targetId == null || targetId === id)) {
                    socket.write(`id:${eventId}${id}\ndata:${eventData}\n\n`)
                }
            }
            socket.write(":\n")
        }

        this._emitRegister(id)

        return id
    }

    /**
     * Unregisters the socket of the given ID from this event publisher.
     *
     * @param {string} id - The ID of the socket.
     * @returns {void}
     */
    unregisterSocket(id) {
        const socket = this.sockets.get(id)
        if (socket != null) {
            socket.end()
            Heartbeat.unregisterSocket(id)
            this.sockets.delete(id)
            this._emitUnregister(id)
        }
    }

    /**
     * Sends the object as a `message` event to all subscribers except the peer of the given ID.
     *
     * @param {string|null} senderId - The ID of sender.
     * @param {object} data - The content to send.
     * @returns {void}
     */
    broadcast(senderId, data) {
        const eventId = IdGenerator.nextId()
        const eventData = JSON.stringify(data)

        for (const [id, socket] of this.sockets.entries()) {
            if (id !== senderId) {
                socket.write(`id:${eventId}${id}\ndata:${eventData}\n\n`)
            }
        }
        this.history.add({eventId, eventData, senderId, targetId: null})
    }

    /**
     * Sends the object as a `message` event to the subscriber of the given ID.
     *
     * @param {string} targetId - The ID of destination.
     * @param {object} data - The content to send.
     * @returns {void}
     */
    send(targetId, data) {
        const eventId = IdGenerator.nextId()
        const eventData = JSON.stringify(data)
        const socket = this.sockets.get(targetId)

        if (socket != null) {
            socket.write(`id:${eventId}${targetId}\ndata:${eventData}\n\n`)
        }
        this.history.add({eventId, eventData, senderId: null, targetId})
    }

    /**
     * Emits "register"/"active" events.
     *
     * @param {string} peerId - The ID of the registered socket.
     * @returns {void}
     * @private
     */
    _emitRegister(peerId) {
        if (this.sockets.size === 1) {
            this.emit("active", {type: "active"})
        }
        this.emit("register", {type: "register", peerId})
    }

    /**
     * Emits "unregister"/"inactive" events.
     *
     * @param {string} peerId - The ID of the registered socket.
     * @returns {void}
     * @private
     */
    _emitUnregister(peerId) {
        this.emit("unregister", {type: "unregister", peerId})
        if (this.sockets.size === 0) {
            this.emit("inactive", {type: "inactive"})
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = ServerSentEvents
