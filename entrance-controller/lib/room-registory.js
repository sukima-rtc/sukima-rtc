/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const HttpError = require("./util/http-error")
const IdGenerator = require("./util/id-generator")
const ServerSentEvents = require("./util/server-sent-events")
const Backend = require("./backend")
const Room = require("./room")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

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
        this.backend = Backend.getBackend(Room.fromJSON, backendArgs)
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
                this._setupSignalHandlers(room)
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
            this._setupSignalHandlers(room)
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

    /**
     * Setups event handlers of signaling channels.
     *
     * @param {Room} room - The room to be setup.
     * @returns {void}
     * @private
     */
    _setupSignalHandlers({id, signals}) {
        /**
         * It handles active/inactive/register/unregister events.
         * @param {object} event - The event object.
         * @returns {void}
         */
        const handler = ({type}) => {
            // Get the current room information
            const room = this.rooms.get(id)
            if (room == null || room.signals !== signals) {
                signals
                    .removeListener("active", handler)
                    .removeListener("inactive", handler)
                    .removeListener("register", handler)
                    .removeListener("unregister", handler)
                return
            }

            if (type === "active") {
                // Redirect the active event to global notifications.
                this.notifications.broadcast(null, {
                    type,
                    room: room.toPublicJSON(),
                })
            }
            else if (type === "inactive") {
                // Redirect the inactive event to global notifications.
                this.notifications.broadcast(null, {
                    type,
                    room: room.toPublicJSON(),
                })
            }
            else {
                // Update the last modified date, then notify an update event.
                const newRoom = room.withModifiedNow()
                this.backend.set(id, newRoom).then(() => {
                    this.rooms.set(id, newRoom)

                    if (newRoom.signals.hasSocket()) {
                        this.notifications.broadcast(null, {
                            type: "update",
                            room: newRoom.toPublicJSON(),
                        })
                    }
                })
            }
        }

        signals
            .on("active", handler)
            .on("inactive", handler)
            .on("register", handler)
            .on("unregister", handler)
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = RoomRegistory
