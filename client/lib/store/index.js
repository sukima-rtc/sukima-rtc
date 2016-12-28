/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Vue = require("vue")
const VueX = require("vuex")
const {ENV} = require("../config")
const playerRegistory = require("./player-registory")
const roomRegistory = require("./room-registory")

Vue.use(VueX)

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    createStore() {
        return new VueX.Store({
            modules: {playerRegistory, roomRegistory},
            strict: ENV !== "production",
        })
    },
}
