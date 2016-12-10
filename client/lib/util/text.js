/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Hash = require("hash.js")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    sha256(text) {
        return Hash.sha256()
            .update(typeof text === "string" ? text : "")
            .digest("hex")
    },
}
