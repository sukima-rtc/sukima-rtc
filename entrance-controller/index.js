/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const cors = require("cors")
const express = require("express")
const roomAPI = require("./lib/room-api")
const config = require("./lib/config")
const HttpError = require("./lib/util/http-error")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

module.exports = new Promise((resolve, reject) => {
    const {router, rooms} = roomAPI.createRouter(config.ROOM_BACKEND)
    const app = express()

    if (config.CLIENT_ORIGIN) {
        app.use(cors({origin: config.CLIENT_ORIGIN}))
    }

    app.use("/rooms", router)
    app.use(HttpError.handle())

    app.listen(config.PORT, /* @this net.Server */ function() {
        const port = this.address().port
        resolve({rooms, port})
    }).on("error", reject)
})
