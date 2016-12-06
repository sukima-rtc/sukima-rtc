/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert")
const {startServer} = require("./lib/test-server")

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("GET /rooms as events", () => {
    let server = null

    beforeEach(async () => {
        server = await startServer()
    })
    afterEach(async () => {
        if (server != null) {
            await server.dispose()
            server = null
        }
    })

    /**
     * Subscribes signaling channel.
     *
     * @param {string} roomId - The room ID to connect.
     * @param {string} password - The password of the room.
     * @returns {Promise<{event: any, next: function}>} The subscription.
     *      `event` is a received event.
     *      `next` is the function to wait for the next event.
     */
    function subscribe(roomId, password) {
        if (roomId == null) {
            return server.subscribe("/rooms")
        }
        return server.subscribe(`/rooms/${roomId}/signals?password=${password}`)
    }

    it("should return an empty array by 'ready' event if no active player.", async () => {
        const {event} = await subscribe()

        assert(event.type === "ready")
        assert(event.rooms.length === 0)
    })

    it("should return an array which includes active rooms (1) by 'ready' event.", async () => {
        await subscribe(server.rooms[1].id, "b")
        const {event} = await subscribe()

        assert(event.type === "ready")
        assert(event.rooms.length === 1)
        assert(event.rooms[0].id === server.rooms[1].id)
        assert(event.rooms[0].name === server.rooms[1].name)
        assert(event.rooms[0].description === server.rooms[1].description)
        assert(event.rooms[0].players === 1)
        assert(event.rooms[0].password === undefined)
    })

    it("should return an array which includes active rooms (2) by 'ready' event.", async () => {
        await subscribe(server.rooms[1].id, "b")
        await subscribe(server.rooms[0].id, "a")
        const {event} = await subscribe()

        event.rooms.sort((a, b) =>
            a.id < b.id ? -1 :
            a.id > b.id ? +1 :
            /* otherwise */ 0
        )

        assert(event.type === "ready")
        assert(event.rooms.length === 2)
        assert(event.rooms[0].id === server.rooms[0].id)
        assert(event.rooms[0].name === server.rooms[0].name)
        assert(event.rooms[0].description === server.rooms[0].description)
        assert(event.rooms[0].players === 1)
        assert(event.rooms[0].password === undefined)
        assert(event.rooms[1].id === server.rooms[1].id)
        assert(event.rooms[1].name === server.rooms[1].name)
        assert(event.rooms[1].description === server.rooms[1].description)
        assert(event.rooms[1].players === 1)
        assert(event.rooms[1].password === undefined)
    })

    it("should notify 'active' events if a room is activated.", async () => {
        const {next, event: ready} = await subscribe()

        assert(ready.type === "ready")
        assert(ready.rooms.length === 0)

        await subscribe(server.rooms[1].id, "b")
        const {event} = await next()

        assert(event.type === "active")
        assert(event.room.id === server.rooms[1].id)
        assert(event.room.name === server.rooms[1].name)
        assert(event.room.description === server.rooms[1].description)
        assert(event.room.players === 1)
        assert(event.room.password === undefined)
    })

    it("should notify 'inactive' events if a room is inactivated.", async () => {
        const {next, event: ready} = await subscribe()
        assert(ready.type === "ready")
        assert(ready.rooms.length === 0)

        const {disconnect} = await subscribe(server.rooms[1].id, "b")

        assert((await next()).event.type === "active")
        assert((await next()).event.type === "update")

        await disconnect()
        const {event} = await next()

        assert(event.type === "inactive")
        assert(event.room.id === server.rooms[1].id)
        assert(event.room.name === server.rooms[1].name)
        assert(event.room.description === server.rooms[1].description)
        assert(event.room.players === 0)
        assert(event.room.password === undefined)
    })

    it("should notify 'update' event if an active room is updated.", async () => {
        const {event: {peerId}} = await subscribe(server.rooms[1].id, "b")
        const {event: ready, next} = await subscribe()

        assert(ready.type === "ready")
        assert(ready.rooms.length === 1)

        await server.request(
            "PUT",
            `/rooms/${server.rooms[1].id}`,
            {
                headers: {Authorization: `Bearer ${peerId}`},
                body: {
                    name: "updated_name",
                    description: "updated_description",
                    password: "c",
                },
            }
        )

        const {event} = await next()
        assert(event.type === "update")
        assert(event.room.id === server.rooms[1].id)
        assert(event.room.name === "updated_name")
        assert(event.room.description === "updated_description")
        assert(event.room.players === 1)
        assert(event.room.password === undefined)
    })
})
