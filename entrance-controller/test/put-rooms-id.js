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

describe("PUT /rooms/:id", () => {
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

    it("should update room's information", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")
        assert(event.type === "ready")

        {
            const {status, body} = await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "c",
                    },
                }
            )

            assert(status === 204)
            assert(body == null)
        }

        const {status, body} = await server.request("GET", `/rooms/${server.rooms[1].id}`)

        assert(status === 200)
        assert(body.id === server.rooms[1].id)
        assert(body.name === "updated_name")
        assert(body.description === "updated_description")
        assert(body.players === 1)
        assert(body.password === undefined)

        // Check the password was updated.
        try {
            await subscribe(server.rooms[1].id, "b")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 401)
        }
        await subscribe(server.rooms[1].id, "c")
    })

    it("should update room's information if exists in backend", async () => {
        makeRoomFile("0q2mf1N1000Y")
        const {event} = await subscribe("0q2mf1N1000Y", "b")
        const {status, body} = await server.request(
            "PUT",
            "/rooms/0q2mf1N1000Y",
            {
                headers: {Authorization: `Bearer ${event.peerId}`},
                body: {
                    name: "updated_name",
                    description: "updated_description",
                    password: "newpassword",
                },
            }
        )

        assert(status === 204)
        assert(body == null)
    })

    it("should return 400 if name was lacking", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 400)
            assert(err.message === "The room should have required property 'name'.")
        }
    })

    it("should return 400 if description was lacking", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        name: "updated_name",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 400)
            assert(err.message === "The room should have required property 'description'.")
        }
    })

    it("should return 400 if password was lacking", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 400)
            assert(err.message === "The room should have required property 'password'.")
        }
    })

    it("should return 400 if name was empty", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        name: "",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 400)
            assert(err.message === "The room.name should NOT be shorter than 1 characters.")
        }
    })

    it("should return 400 if extra properties exist", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: `Bearer ${event.peerId}`},
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                        extra: "hello",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 400)
            assert(err.message === "The room should NOT have additional properties.")
        }
    })

    it("should return 401 if authorization was missing", async () => {
        await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 401)
        }
    })

    it("should return 401 if authorization was wrong", async () => {
        await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: "Bearer wrong"},
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 401)
        }
    })

    it("should return 401 if authorization was not Bearer", async () => {
        await subscribe(server.rooms[1].id, "b")

        try {
            await server.request(
                "PUT",
                `/rooms/${server.rooms[1].id}`,
                {
                    headers: {Authorization: "Basic go"},
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 401)
        }
    })
})
