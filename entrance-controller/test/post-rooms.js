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
const {isValidId} = require("../lib/util/id-generator")
const {startServer} = require("./lib/test-server")

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("POST /rooms", () => {
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

    it("should create a new room", async () => {
        const {status, body} = await server.request(
            "POST",
            "/rooms",
            {
                body: {
                    name: "updated_name",
                    description: "updated_description",
                    password: "c",
                },
            }
        )

        assert(status === 200)
        assert(isValidId(body.id))
        assert(body.name === "updated_name")
        assert(body.description === "updated_description")
        assert(body.players === 0)
        assert(body.password === undefined)
    })

    it("should return 400 if name was lacking", async () => {
        try {
            await server.request(
                "POST",
                "/rooms",
                {
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
        try {
            await server.request(
                "POST",
                "/rooms",
                {
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
        try {
            await server.request(
                "POST",
                "/rooms",
                {
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
        try {
            await server.request(
                "POST",
                "/rooms",
                {
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
        try {
            await server.request(
                "POST",
                "/rooms",
                {
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

    it("should block the client if it created 5 rooms in a day.", async () => {
        for (let i = 0; i < 5; ++i) {
            await server.request(
                "POST",
                "/rooms",
                {
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
        }

        try {
            await server.request(
                "POST",
                "/rooms",
                {
                    body: {
                        name: "updated_name",
                        description: "updated_description",
                        password: "newpassword",
                    },
                }
            )
        }
        catch (err) {
            assert(err.status === 403)
            assert(/blocked/.test(err.message))
        }
    })
})
