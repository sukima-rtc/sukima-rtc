/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The backend implementation which uses file system.
 */
class FsBackendImpl {
    /**
     * Creates a FsBackendImpl instance.
     *
     * @param {string[]} args - The arguments.
     * @param {string} args.0 - The root directory to save.
     */
    constructor([root]) {
        this.root = root
        this.ready = new Promise(resolve => {
            mkdirp(root, resolve)
        })
    }

    /**
     * Read data from a file.
     *
     * @param {string} id - The ID to read.
     * @param {function} cb - The function to be called if finished.
     * @returns {void}
     */
    get(id, cb) {
        this.ready.then(() => {
            fs.readFile(path.join(this.root, id), "utf8", (err, body) => {
                if (err != null && err.code === "ENOENT") {
                    cb(null, null)
                }
                else {
                    cb(err, body)
                }
            })
        })
    }

    /**
     * Write data to a file.
     *
     * @param {string} id - The ID to write.
     * @param {string} data - The content to be written.
     * @param {function} cb - The function to be called if finished.
     * @returns {void}
     */
    set(id, data, cb) {
        this.ready.then(() => {
            fs.writeFile(path.join(this.root, id), data, cb)
        })
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = FsBackendImpl
