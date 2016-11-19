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
const fs = require("fs")
const mkdirp = require("mkdirp")
const {startServer} = require("./lib/test-server")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Make a room file to test loading information from backend.
 *
 * @param {string} id - The ID of the room.
 * @returns {void}
 */
function makeRoomFile(id) {
    mkdirp.sync(".test_workspace/rooms")
    fs.writeFileSync(`.test_workspace/rooms/${id}`, `{"id":"${id}","name":"yakumo","description":"the room to test","password":"179850cca4cf1c617c7b6a716d386f5305d354bab875ce05467560cf679ec7a4","salt":"0.9705369192"}`)
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("GET /rooms as JSON", () => {
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
        return server.subscribe(`/rooms/${roomId}/signals?password=${password}`)
    }

    it("should return an empty array if no active player.", async () => {
        const {status, body} = await server.request("GET", "/rooms")

        assert(status === 200)
        assert(body.length === 0)
    })

    it("should return an array which includes active rooms (1).", async () => {
        await subscribe(server.rooms[1].id, "b")
        const {status, body} = await server.request("GET", "/rooms")

        assert(status === 200)
        assert(body.length === 1)
        assert(body[0].id === server.rooms[1].id)
        assert(body[0].name === server.rooms[1].name)
        assert(body[0].description === server.rooms[1].description)
        assert(body[0].players === 1)
        assert(body[0].password === undefined)
    })

    it("should return an array which includes active rooms (2).", async () => {
        await subscribe(server.rooms[1].id, "b")
        await subscribe(server.rooms[0].id, "a")
        const {status, body} = await server.request("GET", "/rooms")

        body.sort((a, b) =>
            a.id < b.id ? -1 :
            a.id > b.id ? +1 :
            /* otherwise */ 0
        )

        assert(status === 200)
        assert(body.length === 2)
        assert(body[0].id === server.rooms[0].id)
        assert(body[0].name === server.rooms[0].name)
        assert(body[0].description === server.rooms[0].description)
        assert(body[0].players === 1)
        assert(body[0].password === undefined)
        assert(body[1].id === server.rooms[1].id)
        assert(body[1].name === server.rooms[1].name)
        assert(body[1].description === server.rooms[1].description)
        assert(body[1].players === 1)
        assert(body[1].password === undefined)
    })

    it("should return an array which includes active rooms (3).", async () => {
        makeRoomFile("0q2mf1N1000Y")
        await subscribe("0q2mf1N1000Y", "b")
        await subscribe(server.rooms[0].id, "a")
        await subscribe(server.rooms[1].id, "b")
        const {status, body} = await server.request("GET", "/rooms")

        body.sort((a, b) =>
            a.id < b.id ? -1 :
            a.id > b.id ? +1 :
            /* otherwise */ 0
        )

        assert(status === 200)
        assert(body.length === 3)
        assert(body[0].id === "0q2mf1N1000Y")
        assert(body[0].name === "yakumo")
        assert(body[0].description === "the room to test")
        assert(body[0].players === 1)
        assert(body[0].password === undefined)
        assert(body[1].id === server.rooms[0].id)
        assert(body[1].name === server.rooms[0].name)
        assert(body[1].description === server.rooms[0].description)
        assert(body[1].players === 1)
        assert(body[1].password === undefined)
        assert(body[2].id === server.rooms[1].id)
        assert(body[2].name === server.rooms[1].name)
        assert(body[2].description === server.rooms[1].description)
        assert(body[2].players === 1)
        assert(body[2].password === undefined)
    })

    it("should not include inactive rooms.", async () => {
        const {disconnect} = await subscribe(server.rooms[0].id, "a")
        await subscribe(server.rooms[1].id, "b")

        // Go innactive
        await disconnect()

        const {status, body} = await server.request("GET", "/rooms")

        assert(status === 200)
        assert(body.length === 1)
        assert(body[0].id === server.rooms[1].id)
        assert(body[0].name === server.rooms[1].name)
        assert(body[0].description === server.rooms[1].description)
        assert(body[0].players === 1)
        assert(body[0].password === undefined)
    })
})
