/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const testData = [
    {
        name: "hakurei",
        description: "the room to test - 1",
        password: "a",
    },
    {
        name: "yakumo",
        description: "the room to test - 2",
        password: "b",
    },
    {
        name: "kirisame",
        description: "the room to test - 3",
        password: "c",
    },
]

/**
 * Defines `request` method for tests.
 *
 * @param {number} port - The port of test server.
 * @returns {function} The defiend `request` method.
 */
function defineRequest(port) {
    const {Buffer} = require("buffer")
    const http = require("http")

    return (method, path, {headers = {}, body} = {}) =>
        new Promise((resolve, reject) => {
            const bodyData = body && JSON.stringify(body)
            const req = http.request(
                {
                    method,
                    port,
                    path,
                    headers: Object.assign(
                        {Accept: "application/json"},
                        bodyData ? {
                            "Content-Type": "application/json",
                            "Content-Length": Buffer.byteLength(bodyData),
                        } : {},
                        headers
                    ),
                },
                (res) => {
                    const chunks = []

                    res.on("data", (chunk) => {
                        chunks.push(chunk)
                    })
                    res.on("end", () => {
                        try {
                            const retBody = (chunks.length === 0)
                                ? null
                                : JSON.parse(Buffer.concat(chunks).toString())

                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve({
                                    status: res.statusCode,
                                    body: retBody,
                                })
                            }
                            else {
                                const err = new Error(retBody ? retBody.error : res.statusMessage)
                                err.status = res.statusCode
                                reject(err)
                            }
                        }
                        catch (err) {
                            reject(err)
                        }
                    })
                    res.on("error", reject)
                }
            )
            req.on("error", reject)

            if (bodyData) {
                req.write(bodyData)
            }
            req.end()
        })
}

/**
 * Defines `subscribe` method for tests.
 *
 * @param {number} port - The port of test server.
 * @param {EventSource[]} subscribers - The subscriber list in order to dispose.
 * @returns {function} The defiend `subscribe` method.
 */
function defineSubscribe(port, subscribers) {
    const EventSource = require("eventsource")
    return (path) => {
        const sse = new EventSource(`http://localhost:${port}${path}`)
        const events = []
        const waiting = []
        let lastError = null

        subscribers.push(sse)

        /**
         * Wait for the next event.
         * @returns {Promise<{event: any, next: function}>} The next event and the function to wait for the next-next event.
         */
        function next() {
            if (lastError != null) {
                return lastError
            }
            if (events.length >= 1) {
                return events.shift()
            }
            return new Promise((resolve, reject) => {
                waiting.push({resolve, reject})
            })
        }

        /**
         * Close this EventSource.
         * @returns {void}
         */
        function disconnect() {
            sse.close()
            subscribers.splice(subscribers.indexOf(sse), 1)
        }

        sse.addEventListener("message", (message) => {
            try {
                const event = JSON.parse(message.data)

                if (waiting.length >= 1) {
                    waiting.shift().resolve({event, next, disconnect})
                }
                else {
                    events.push(Promise.resolve({event, next, disconnect}))
                }
            }
            catch (err) {
                if (waiting.length >= 1) {
                    waiting.shift().reject(err)
                }
                else {
                    events.push(Promise.reject(err))
                }
            }
        })
        sse.addEventListener("error", (err) => {
            lastError = Promise.reject(err)
            lastError.catch(() => "to prevent UnhandledPromiseRejectionWarning")

            for (const {reject} of waiting) {
                reject(err)
            }
            waiting.splice(0, waiting.length)
        })

        return next()
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    startServer() {
        return new Promise((resolve, reject) => {
            const cp = require("child_process").spawn(
                process.execPath,
                [__filename],
                {
                    stdio: [0, 1, 2, "ipc"],
                    env: {
                        PORT: "0",
                        ROOM_BACKEND: "fs .test_workspace/rooms",
                    },
                }
            )

            cp.on("message", (message) => {
                const subscribers = []
                resolve({
                    rooms: message.rooms,
                    request: defineRequest(message.port),
                    subscribe: defineSubscribe(message.port, subscribers),

                    dispose() {
                        return new Promise(resolve2 => {
                            for (const s of subscribers) {
                                s.close()
                            }
                            require("rimraf").sync(".test_workspace")
                            cp.send({type: "kill"})
                            cp.on("exit", resolve2)
                        })
                    },
                })
            })
            cp.on("error", reject)
            cp.on("close", (exitCode) => {
                reject(new Error(`Exited with ${exitCode}`))
            })
        })
    },
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/*eslint-disable no-console, no-process-exit */

if (require.main === module) {
    require("../../index").then(({rooms, port}) =>
        Promise.all(
            testData.map(({name, description, password}) =>
                rooms.create(name, description, password)
            )
        ).then(testRooms => {
            process.send({
                type: "ready",
                port,
                rooms: testRooms.map(room => room.toPublicJSON()),
            })
        })
    ).catch(err => {
        console.error(err)
        process.exit(1)
    })

    // Handle kill request.
    process.on("message", () => {
        process.exit(0)
    })
}

process.on("unhandledRejection", (r) => console.log(r))

/*eslint-enable */
