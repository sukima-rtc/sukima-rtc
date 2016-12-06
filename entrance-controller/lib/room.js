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
 *
 * `modifiedAt` will be modified when:
 *
 * - `name` field was updated.
 * - `description` field was updated.
 * - `password` field was updated.
 * - A player was joined.
 *
 * (Room instances are immutable, so registory should update it.)
 */
class Room {
    /**
     * Creates a new room instance.
     *
     * @param {string} id - The ID of this room.
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {Date} createdAt - The date that this room was created.
     * @param {Date} modifiedAt - The date that this room was modified.
     * @param {string} password - The hashed password of this room.
     * @param {string} salt - The salt of the hashed password.
     * @param {ServerSentEvents} signals - The signaling channel of this room.
     */
    constructor(
        id,
        name,
        description,
        createdAt,
        modifiedAt,
        password,
        salt,
        signals
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.createdAt = createdAt
        this.modifiedAt = modifiedAt
        this.password = password
        this.salt = salt
        this.signals = signals
    }

    /**
     * Creates a new room instance.
     *
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {string} password - The raw password of this room.
     * @returns {Room} The created room.
     */
    static new(name, description, password) {
        const id = IdGenerator.nextId()
        const salt = takeSalt()
        const createdAt = Object.freeze(new Date())
        const room = new Room(
            id,
            name,
            description,
            createdAt,
            createdAt,
            cookPassword(password, salt),
            salt,
            ServerSentEvents.new()
        )
        room._setupSignalHandlers()

        return Object.freeze(room)
    }

    /**
     * Creates a new room instance with the given parameters.
     *
     * @param {string} name - The name of this room.
     * @param {string} description - The description of this room.
     * @param {string} password - The raw password of this room.
     * @returns {Room} The created room.
     */
    with(name, description, password) {
        const salt = takeSalt()
        return Object.freeze(new Room(
            this.id,
            name,
            description,
            this.createdAt,
            Object.freeze(new Date()),
            cookPassword(password, salt),
            salt,
            this.signals
        ))
    }

    /**
     * Creates a new room instance with new modified date time.
     *
     * @returns {Room} The created room.
     */
    withModifiedNow() {
        return Object.freeze(new Room(
            this.id,
            this.name,
            this.description,
            this.createdAt,
            Object.freeze(new Date()),
            this.password,
            this.salt,
            this.signals
        ))
    }

    /**
     * Creates a new room instance from stored data.
     *
     * @param {object} data - The data which was created by `toJSON()` method.
     * @param {string} data.id - The ID of this room.
     * @param {string} data.name - The name of this room.
     * @param {string} data.description - The description of this room.
     * @param {string} data.createdAt - The date that this room was created.
     * @param {string} data.modifiedAt - The date that this room was modified.
     * @param {string} data.password - The hashed password of this room.
     * @param {string} data.salt - The salt of the hashed password.
     * @param {ServerSentEvents} notifications - The notification manager of room registory.
     * @returns {Room} The created room.
     */
    static fromJSON({
        id,
        name,
        description,
        createdAt,
        modifiedAt,
        password,
        salt,
    }) {
        const room = new Room(
            id,
            name,
            description,
            Object.freeze(new Date(createdAt)),
            Object.freeze(new Date(modifiedAt)),
            password,
            salt,
            ServerSentEvents.new()
        )
        room._setupSignalHandlers()

        return Object.freeze(room)
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
            createdAt: this.createdAt.toISOString(),
            modifiedAt: this.modifiedAt.toISOString(),
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
            createdAt: this.createdAt.toISOString(),
            modifiedAt: this.modifiedAt.toISOString(),
            players: this.signals.size,
        }
    }

    /**
     * Checks whether nobody is in this room or not.
     *
     * @returns {boolean} `true` if nobody is in this room.
     */
    get isEmpty() {
        return !this.signals.hasSocket()
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
     * @returns {void}
     * @private
     */
    _setupSignalHandlers() {
        const handler = ({type, peerId}) => {
            this.signals.broadcast(
                peerId,
                {
                    type: (type === "register") ? "join" : "leave",
                    peerId,
                }
            )
        }
        this.signals
            .on("register", handler)
            .on("unregister", handler)
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Room
