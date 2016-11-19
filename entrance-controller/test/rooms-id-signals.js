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
const {isValidId} = require("../lib/util/id-generator")
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

describe("GET,POST /rooms/:id/signals", () => {
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

    it("should notify a 'ready' event at the first", async () => {
        const {event} = await subscribe(server.rooms[1].id, "b")

        assert(event.type === "ready")
        assert(isValidId(event.peerId))
        assert(event.room.id === server.rooms[1].id)
        assert(event.room.name === server.rooms[1].name)
        assert(event.room.description === server.rooms[1].description)
        assert(event.room.password === undefined)
    })

    it("should notify a 'join' event if new player was subscribe", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(join12.type === "join")
        assert(join12.peerId === ready2.peerId)

        const {event: ready3} = await subscribe(server.rooms[1].id, "b")
        const {event: join13} = await next1()
        const {event: join23} = await next2()

        assert(join13.type === "join")
        assert(join23.type === "join")
        assert(ready3.type === "ready")
        assert(join13.peerId === ready3.peerId)
        assert(join23.peerId === ready3.peerId)
    })

    it("should notify a 'leave' event if a player was disconnected", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2, disconnect: disconnect2} = await subscribe(server.rooms[1].id, "b")
        const {event: ready3, disconnect: disconnect3} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()
        const {event: join13} = await next1()
        const {event: join23} = await next2()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(ready3.type === "ready")
        assert(join12.type === "join")
        assert(join13.type === "join")
        assert(join23.type === "join")

        await disconnect3()
        const {event: leave13} = await next1()
        const {event: leave23} = await next2()

        assert(leave13.type === "leave")
        assert(leave23.type === "leave")
        assert(leave13.peerId === ready3.peerId)
        assert(leave23.peerId === ready3.peerId)

        await disconnect2()
        const {event: leave12} = await next1()

        assert(leave12.type === "leave")
        assert(leave12.peerId === ready2.peerId)
    })

    it("should notify a 'update' event if the room information was updated", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(join12.type === "join")

        await server.request(
            "PUT",
            `/rooms/${server.rooms[1].id}`,
            {
                headers: {Authorization: `Bearer ${ready1.peerId}`},
                body: {
                    name: "updated_name",
                    description: "updated_description",
                    password: "b",
                },
            }
        )
        const {event: update2} = await next2()

        assert(update2.type === "update")
        assert(update2.room.id === server.rooms[1].id)
        assert(update2.room.name === "updated_name")
        assert(update2.room.description === "updated_description")
        assert(update2.room.password === undefined)
    })

    it("should return 401 if the password was wrong", async () => {
        try {
            await subscribe(server.rooms[1].id, "a")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 401)
        }
    })

    it("should return 404 if the room did not exist", async () => {
        try {
            await subscribe("0q2mE6t8000f", "a")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 404)
        }
    })

    it("should return 404 if the roomID is invalid even if exists in backend", async () => {
        makeRoomFile("0q2mf1N10000") // ← this check-sum is wrong
        try {
            await subscribe("0q2mf1N10000", "a")
            assert(false, "should fail to connect")
        }
        catch (err) {
            assert(err.status === 404)
        }
    })

    it("should notify a 'iceCandidate' event if the event posted.", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(join12.type === "join")

        await server.request(
            "POST",
            `/rooms/${server.rooms[1].id}/signals`,
            {
                headers: {Authorization: `Bearer ${ready1.peerId}`},
                body: {
                    type: "iceCandidate",
                    targetId: ready2.peerId,
                    candidate: "qwerfdsazxcv",
                },
            }
        )
        const {event: iceCandidate} = await next2()

        assert(iceCandidate.type === "iceCandidate")
        assert(iceCandidate.senderId === ready1.peerId)
        assert(iceCandidate.targetId === ready2.peerId)
        assert(iceCandidate.candidate === "qwerfdsazxcv")
    })

    it("should notify a 'negotiationOffer' event if the event posted.", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(join12.type === "join")

        await server.request(
            "POST",
            `/rooms/${server.rooms[1].id}/signals`,
            {
                headers: {Authorization: `Bearer ${ready1.peerId}`},
                body: {
                    type: "negotiationOffer",
                    targetId: ready2.peerId,
                    description: "qwerfdsazxcv",
                },
            }
        )
        const {event: negotiationOffer} = await next2()

        assert(negotiationOffer.type === "negotiationOffer")
        assert(negotiationOffer.senderId === ready1.peerId)
        assert(negotiationOffer.targetId === ready2.peerId)
        assert(negotiationOffer.description === "qwerfdsazxcv")
    })

    it("should notify a 'negotiationAnswer' event if the event posted.", async () => {
        const {event: ready1, next: next1} = await subscribe(server.rooms[1].id, "b")
        const {event: ready2, next: next2} = await subscribe(server.rooms[1].id, "b")
        const {event: join12} = await next1()

        assert(ready1.type === "ready")
        assert(ready2.type === "ready")
        assert(join12.type === "join")

        await server.request(
            "POST",
            `/rooms/${server.rooms[1].id}/signals`,
            {
                headers: {Authorization: `Bearer ${ready1.peerId}`},
                body: {
                    type: "negotiationAnswer",
                    targetId: ready2.peerId,
                    description: "qwerfdsazxcv",
                },
            }
        )
        const {event: negotiationAnswer} = await next2()

        assert(negotiationAnswer.type === "negotiationAnswer")
        assert(negotiationAnswer.senderId === ready1.peerId)
        assert(negotiationAnswer.targetId === ready2.peerId)
        assert(negotiationAnswer.description === "qwerfdsazxcv")
    })

    it("should block the client if authorization was failed 5 times in a day.", async () => {
        for (let i = 0; i < 5; ++i) {
            try {
                await subscribe(server.rooms[1].id, String(1 + i))
                assert(false)
            }
            catch (err) {
                assert(err.status === 401)
            }
        }

        try {
            await subscribe(server.rooms[1].id, "6")
        }
        catch (err) {
            assert(err.status === 403)
        }
    })
})
