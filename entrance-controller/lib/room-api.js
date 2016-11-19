/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Ajv = require("ajv")
const bodyParser = require("body-parser")
const express = require("express")
const ROOMS_SCHEMA = require("./schema/rooms.json")
const SIGNALS_SCHEMA = require("./schema/signals.json")
const HttpError = require("./util/http-error")
const RoomRegistory = require("./room-registory")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ajv = new Ajv()
const validateRoom = ajv.compile(ROOMS_SCHEMA)
const validateSignal = ajv.compile(SIGNALS_SCHEMA)

/**
 * The controller to block clients.
 */
class BlockController {
    /**
     * Creates a ChallangeMap instance.
     *
     * @param {number} [maxCount=5] - The maximum number to allow challanges.
     * @param {number} [timeout=86400000] - The time to reset blocking.
     */
    constructor(maxCount = 5, timeout = 86400000) {
        this.info = new Map()
        this.maxCount = maxCount
        this.timeout = timeout

        this.checkExceeded = (req, res, next) => {
            const info = this.info.get(req.ip)
            if (info != null && info.count >= this.maxCount) {
                const expires = new Date(info.expires).toISOString()
                next(HttpError.new(403, `You are blocked until '${expires}'.`))
            }
            else {
                next()
            }
        }
    }

    /**
     * Ups the count of the given IP address.
     *
     * @param {string} ip - IP address to count up.
     * @returns {void}
     */
    countUp(ip) {
        let info = this.info.get(ip)
        if (info == null) {
            // Dispose this challange information after expired.
            const dispose = () => {
                const now = Date.now()

                if (now >= info.expires) {
                    this.info.delete(ip)
                }
                else {
                    setTimeout(dispose, this.timeout - (info.expires - now))
                }
            }

            // Initialize.
            info = {
                expires: 0,
                count: 0,
                timer: setTimeout(dispose, this.timeout),
            }
            this.info.set(ip, info)
        }

        // Update.
        info.expires = Date.now()
        info.count += 1
    }

    /**
     * Resets the blocking of the given IP address.
     *
     * @param {string} ip - IP address to reset.
     * @returns {void}
     */
    reset(ip) {
        const info = this.info.get(ip)
        if (info != null) {
            clearTimeout(info.timer)
            this.info.delete(ip)
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    /**
     * Creates the router of rooms.
     *
     * @param {string[]} backendArgs - The arguments for backend implementation.
     * @returns {{router: express.Router, rooms: RoomRegistory}} The created router and room registory.
     */
    createRouter(backendArgs) {
        const rooms = RoomRegistory.new(backendArgs)
        const router = new express.Router()
        const parseBody = bodyParser.json()
        const authBlocker = new BlockController()
        const roomBlocker = new BlockController()

        /**
         * This middleware checks whether the request accepts JSON response data or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function canRespondJson(req, res, next) {
            next(req.accepts("application/json") ? null : HttpError.new(406))
        }

        /**
         * This middleware checks whether the request accepts event stream response data or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function canRespondEventStream(req, res, next) {
            next(req.accepts("text/event-stream") ? null : HttpError.new(406))
        }

        /**
         * This middleware checks whether the specified room exists or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function roomExists(req, res, next) {
            rooms.getRoomById(req.params.roomId).then(
                (room) => {
                    req.room = room
                    next(room ? null : HttpError.new(404))
                },
                next
            )
        }

        /**
         * This middleware checks whether the password is correct or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function authRoom(req, res, next) {
            const room = req.room

            if (!room.authenticate(req.query.password || "")) {
                authBlocker.countUp(req.ip)
                res.set("WWW-Authenticate", `X-Password realm="${room.id}"`)
                next(HttpError.new(401, "'password' was wrong."))
            }
            else {
                authBlocker.reset(req.ip)
                next()
            }
        }

        /**
         * This middleware checks whether the password is correct or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function authSender(req, res, next) {
            const room = req.room
            const auth = req.get("Authorization")

            if (auth == null) {
                authBlocker.countUp(req.ip)
                res.set("WWW-Authenticate", `Bearer realm="${room.id}"`)
                next(HttpError.new(401))
                return
            }

            const [scheme, senderId] = auth.split(/\s+/)
            if (scheme !== "Bearer") {
                authBlocker.countUp(req.ip)
                res.set(
                    "WWW-Authenticate",
                    `Bearer realm="${room.id}" error="invalid_scheme"`
                )
                next(HttpError.new(401))
                return
            }
            if (!room.signals.hasSocket(senderId)) {
                authBlocker.countUp(req.ip)
                res.set(
                    "WWW-Authenticate",
                    `Bearer realm="${room.id}" error="invalid_token"`
                )
                next(HttpError.new(401))
                return
            }

            authBlocker.reset(req.ip)
            req.body.senderId = senderId
            next()
        }

        /**
         * This middleware checks whether the body data is correct or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function validateRoomBody(req, res, next) {
            if (!validateRoom(req.body)) {
                const err = validateRoom.errors[0]
                next(HttpError.new(
                    400,
                    `The room${err.dataPath} ${err.message}.`
                ))
                return
            }
            next()
        }

        /**
         * This middleware checks whether the body data is correct or not.
         * @param {express.Request} req - The request to check.
         * @param {express.Response} res - The response to check.
         * @param {function} next - The function to pass the next middleware.
         * @returns {void}
         * @private
         */
        function validateSignalBody(req, res, next) {
            if (!validateSignal(req.body)) {
                const err = validateSignal.errors[0]
                next(HttpError.new(
                    400,
                    `The signal${err.dataPath} ${err.message}.`
                ))
                return
            }
            next()
        }

        //----------------------------------------------------------------------

        // GET /rooms
        router.get("/", (req, res) => {
            if (req.accepts("application/json")) {
                res.json(Array.from(rooms.getRooms()))
                return
            }
            if (req.accepts("text/event-stream")) {
                const lastEventId = req.get("Last-Event-ID")

                rooms.notifications.registerSocket(
                    res,
                    {
                        lastEventId,
                        ready(event) {
                            // Return rooms in the ready event.
                            event.rooms = Array.from(rooms.getRooms())
                            return event
                        },
                    }
                )
                return
            }

            res.status(406).end()
        })

        // POST /rooms
        router.post(
            "/",
            canRespondJson,
            parseBody,
            validateRoomBody,
            roomBlocker.checkExceeded,
            (req, res, next) => {
                const {name, description, password} = req.body
                rooms.create(name, description, password).then(
                    (room) => {
                        roomBlocker.countUp(req.ip)
                        res.status(200).json(room.toPublicJSON())
                    },
                    next
                )
            }
        )

        // GET /rooms/:roomId
        router.get(
            "/:roomId",
            canRespondJson,
            roomExists,
            (req, res) => {
                res.status(200).json(req.room.toPublicJSON())
            }
        )

        // PUT /rooms/:roomId
        router.put(
            "/:roomId",
            canRespondJson,
            roomExists,
            parseBody,
            authBlocker.checkExceeded,
            authSender,
            validateRoomBody,
            (req, res, next) => {
                const roomId = req.params.roomId
                const {name, description, password, senderId} = req.body

                rooms
                    .update(roomId, name, description, password, senderId)
                    .then(
                        () => {
                            res.status(204).end()
                        },
                        next
                    )
            }
        )

        // GET /rooms/:roomId/signals
        router.get(
            "/:roomId/signals",
            canRespondEventStream,
            roomExists,
            authBlocker.checkExceeded,
            authRoom,
            (req, res) => {
                const room = req.room
                const peerId = req.query.peerId
                const lastEventId = req.get("Last-Event-ID")

                room.signals.registerSocket(
                    res,
                    {
                        lastEventId,
                        peerId,
                        ready(event) {
                            event.room = room.toPublicJSON()
                            return event
                        },
                    }
                )
            }
        )

        // POST /rooms/:roomId/signals
        router.post(
            "/:roomId/signals",
            canRespondJson,
            roomExists,
            parseBody,
            authBlocker.checkExceeded,
            authSender,
            validateSignalBody,
            (req, res) => {
                if (req.body.targetId != null) {
                    req.room.signals.send(req.body.targetId, req.body)
                }
                else {
                    req.room.signals.broadcast(req.body.senderId, req.body)
                }
                res.status(204).end()
            }
        )

        return {router, rooms}
    },
}
