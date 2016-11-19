/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const crypto = require("crypto")
const Backend = require("./backend")
const HttpError = require("./util/http-error")
const IdGenerator = require("./util/id-generator")
const ServerSentEvents = require("./util/server-sent-events")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Creates a random string for salt of passwords.
 *
 * @returns {string} The created salt.
 * @private
 */
function takeSalt() {
    return Math.random().toFixed(10)
}

/**
 * Creates a salted hash for passwords.
 *
 * @param {string} password - The password to hash.
 * @param {string} salt - The salt to hash.
 * @returns {string} The created hash.
 * @private
 */
function cookPassword(password, salt) {
    return crypto.createHash("sha256")
        .update(password)
        .update(salt)
        .digest("hex")
}

/**
 * The room type.
 * This class stores information to do entrance control for each room.
 */
class Room {
    /**
     * Creates a new room instance.
     *
     * @param {string} id - The ID of this room.
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {string} password - The hashed password of this room.
     * @param {string} salt - The salt of the hashed password.
     * @param {ServerSentEvents} signals - The signaling channel of this room.
     */
    constructor(id, name, description, password, salt, signals) {
        this.id = id
        this.name = name
        this.description = description
        this.password = password
        this.salt = salt
        this.signals = signals

        Object.freeze(this)
    }

    /**
     * Creates a new room instance.
     *
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {string} password - The raw password of this room.
     * @param {ServerSentEvents} notifications - The notification manager of room registory.
     * @returns {Room} The created room.
     */
    static new(name, description, password, notifications) {
        const id = IdGenerator.nextId()
        const salt = takeSalt()
        const room = new Room(
            id,
            name,
            description,
            cookPassword(password, salt),
            salt,
            ServerSentEvents.new()
        )
        room._setupSignalHandlers(notifications)

        return room
    }

    /**
     * Creates a new room instance.
     *
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {string} password - The raw password of this room.
     * @returns {Room} The created room.
     */
    with(name, description, password) {
        const salt = takeSalt()
        return new Room(
            this.id,
            name,
            description,
            cookPassword(password, salt),
            salt,
            this.signals
        )
    }

    /**
     * Creates a new room instance from stored data.
     *
     * @param {object} data - The data which was created by `toJSON()` method.
     * @param {string} data.id - The ID of this room.
     * @param {string} data.name - The name of this room.
     * @param {string} data.description - The description of this room.
     * @param {string} data.password - The hashed password of this room.
     * @param {string} data.salt - The salt of the hashed password.
     * @param {ServerSentEvents} notifications - The notification manager of room registory.
     * @returns {Room} The created room.
     */
    static fromJSON({id, name, description, password, salt}, notifications) {
        const room = new Room(
            id,
            name,
            description,
            password,
            salt,
            ServerSentEvents.new()
        )
        room._setupSignalHandlers(notifications)

        return room
    }

    /**
     * Creates the data to store.
     * This is used by `JSON.stringify` function.
     *
     * @returns {object} The data to store.
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            password: this.password,
            salt: this.salt,
        }
    }

    /**
     * Creates the data for public API.
     *
     * @returns {object} The data for public API.
     */
    toPublicJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            players: this.signals.size,
        }
    }

    /**
     * Authenticates the given password.
     *
     * @param {string} password - The password to authenticate.
     * @returns {boolean} `true` if the password is good.
     */
    authenticate(password) {
        return cookPassword(password, this.salt) === this.password
    }

    /**
     * Setups event handlers of signaling channels.
     *
     * @param {ServerSentEvents} notifications - The SSE to notify events.
     * @returns {void}
     * @private
     */
    _setupSignalHandlers(notifications) {
        const handler = ({type, peerId}) => {
            // events for the room list
            notifications.broadcast(null, {
                type: (
                    type === "active" ? "open" :
                    type === "inactive" ? "close" :
                    /* otherwise */ "update"
                ),
                room: this.toPublicJSON(),
            })

            // events for room members
            if (type === "register") {
                this.signals.broadcast(peerId, {type: "join", peerId})
            }
            if (type === "unregister") {
                this.signals.broadcast(peerId, {type: "leave", peerId})
            }
        }

        this.signals
            .on("active", handler)
            .on("inactive", handler)
            .on("register", handler)
            .on("unregister", handler)
    }
}

/**
 * The class which stores rooms.
 */
class RoomRegistory {
    /**
     * Creates a RoomRegistory instance.
     *
     * @param {string[]} backendArgs - The arguments for backend implementation.
     */
    constructor(backendArgs) {
        this.backend = Backend.getBackend(
            (data) => Room.fromJSON(data, this.notifications),
            backendArgs
        )
        this.rooms = new Map()
        this.notifications = ServerSentEvents.new()
    }

    /**
     * Creates a RoomRegistory instance.
     *
     * @param {string[]} backendArgs - The arguments for backend implementation.
     * @returns {RoomRegistory} The created registory.
     */
    static new(backendArgs) {
        return new RoomRegistory(backendArgs)
    }

    /**
     * Iterates rooms that players are in the room.
     *
     * @returns {IterableIterator<Room>} The iterator.
     */
    * getRooms() {
        for (const room of this.rooms.values()) {
            if (room.signals.hasSocket()) {
                yield room.toPublicJSON()
            }
        }
    }

    /**
     * Gets the room of the given ID.
     *
     * @param {string} id - The ID to get.
     * @returns {Promise<Room|null>} The room.
     */
    getRoomById(id) {
        if (this.rooms.has(id)) {
            return Promise.resolve(this.rooms.get(id))
        }
        if (!IdGenerator.isValidId(id)) {
            return HttpError.reject(404)
        }

        // Restore the room from the backend.
        return this.backend.get(id).then(room => {
            if (room != null) {
                this.rooms.set(id, room)
            }
            return room
        })
    }

    /**
     * Creates a new room instance in this repository.
     *
     * @param {string} name - The name of the new room.
     * @param {string} description - The description of the new room.
     * @param {string} password - The password of the new room.
     * @returns {Promise<Room>} The created room.
     */
    create(name, description, password) {
        const room = Room.new(name, description, password, this.notifications)

        return this.backend.set(room.id, room).then(() => {
            this.rooms.set(room.id, room)
            return room
        })
    }

    /**
     * Updates the properties of the specified room.
     *
     * @param {string} id - The ID to update.
     * @param {string} name - The new name of the room.
     * @param {string} description - The new description of the room.
     * @param {string} password - The new password of the room.
     * @param {string} [senderId] - The updater's socket ID.
     * @returns {Promise<void>} The updated room.
     */
    update(id, name, description, password, senderId = null) {
        if (!IdGenerator.isValidId(id)) {
            return HttpError.reject(404)
        }
        return this.getRoomById(id).then(oldRoom => {
            if (!oldRoom) {
                return HttpError.reject(404)
            }
            const room = oldRoom.with(name, description, password)

            return this.backend.set(id, room).then(() => {
                const event = {
                    type: "update",
                    room: room.toPublicJSON(),
                }

                this.rooms.set(room.id, room)
                this.notifications.broadcast(senderId, event)
                room.signals.broadcast(senderId, event)

                return room
            })
        })
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = RoomRegistory
