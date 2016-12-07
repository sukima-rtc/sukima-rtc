/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    startEntranceControlServer() {
        return new Promise((resolve, reject) => {
            const cp = require("child_process").spawn(
                process.execPath,
                [__filename],
                {
                    stdio: [0, 1, 2, "ipc"],
                    env: {
                        CLIENT_ORIGIN: "http://localhost:3000",
                        PORT: "3001",
                        ROOM_BACKEND: "fs .test_workspace/rooms",
                    },
                }
            )

            cp.on("message", () => {
                resolve({
                    dispose() {
                        return new Promise(resolve2 => {
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
    require("../../../entrance-controller").then(
        () => {
            process.send({type: "ready"})
        },
        (err) => {
            console.error(err)
            process.exit(1)
        }
    )

    // Handle kill request.
    process.on("message", () => {
        process.exit(0)
    })
}

/*eslint-enable */
