/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {startClientServer} = require("./client-server")
const {startEntranceControlServer} = require("./entrance-controller")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/*eslint-disable no-console, no-process-exit */

Promise.all([
    startClientServer(),
    startEntranceControlServer(),
]).then(() => {
    console.log("http://localhost:3000/")
}).catch(err => {
    console.error(err)
    setImmediate(() => {
        process.exit(1)
    })
})

/*eslint-enable */
