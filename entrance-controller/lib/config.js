/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

/*eslint no-process-env: off */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Object.freeze({
    PORT: process.env.PORT || 80,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "",
    ROOM_BACKEND: Object.freeze(
        (process.env.ROOM_BACKEND || "none").split(" ")
    ),
})
