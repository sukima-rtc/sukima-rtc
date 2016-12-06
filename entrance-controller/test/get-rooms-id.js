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
    fs.writeFileSync(`.test_workspace/rooms/${id}`, `{"id":"${id}","name":"yakumo","description":"the room to test","password":"179850cca4cf1c617c7b6a716d386f5305d354bab875ce05467560cf679ec7a4","salt":"0.9705369192","createdAt":"2016-12-06T10:59:06.248Z","modifiedAt":"2016-12-06T10:59:06.248Z"}`)
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("GET /rooms/:id", () => {
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

    it("should return room's information if exists", async () => {
        const {status, body} = await server.request("GET", `/rooms/${server.rooms[0].id}`)

        assert(status === 200)
        assert(body.id === server.rooms[0].id)
        assert(body.name === server.rooms[0].name)
        assert(body.description === server.rooms[0].description)
        assert(body.players === 0)
        assert(body.password === undefined)
    })

    it("should return room's information if exists in backend", async () => {
        makeRoomFile("0q2mf1N1000Y")
        const {status, body} = await server.request("GET", "/rooms/0q2mf1N1000Y")

        assert(status === 200)
        assert(body.id === "0q2mf1N1000Y")
        assert(body.name === "yakumo")
        assert(body.description === "the room to test")
        assert(body.players === 0)
        assert(body.password === undefined)
    })

    it("should return 404 if does not exist", async () => {
        try {
            await server.request("GET", "/rooms/0q2mE6t8000f")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 404)
        }
    })

    it("should return 404 if the ID is invalid even if exists in backend", async () => {
        makeRoomFile("0q2mf1N10000") // ← this check-sum is wrong
        try {
            await server.request("GET", "/rooms/0q2mf1N10000")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 404)
        }
    })
})
