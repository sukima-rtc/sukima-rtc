/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {ENV} = require("./config")
const roomRegistory = require("./room-registory")

module.exports = {
    modules: {roomRegistory},
    strict: ENV !== "production",
}
