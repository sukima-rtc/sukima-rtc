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
const BackendBase = require("./backend-base")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The backend implementation by file system.
 */
class FsBackend extends BackendBase {
    /**
     * Creates a FsBackend instance.
     *
     * @param {function} create - The function to create model instance.
     * @param {string[]} args - The arguments.
     * @param {string} args.0 - The root directory to save.
     */
    constructor(create, [root]) {
        super()
        this.create = create
        this.root = root
    }

    /**
     * Read data from a file.
     *
     * @param {function} resolve - The function to become fulfilled.
     * @param {function} reject - The function to become rejected.
     * @param {string} id - The ID to read.
     * @returns {void}
     */
    read(resolve, reject, id) {
        fs.readFile(path.join(this.root, id), "utf8", (err, body) => {
            if (err == null || err.code === "ENOENT") {
                resolve(body || null)
            }
            else {
                reject(err)
            }
        })
    }

    /**
     * Write data to a file.
     *
     * @param {function} resolve - The function to become fulfilled.
     * @param {function} reject - The function to become rejected.
     * @param {string} id - The ID to write.
     * @param {string} body - The content to write.
     * @returns {void}
     */
    write(resolve, reject, id, body) {
        mkdirp(this.root, (dirError) => {
            if (dirError != null) {
                reject(dirError)
                return
            }

            fs.writeFile(path.join(this.root, id), body, (fileError) => {
                if (fileError != null) {
                    reject(fileError)
                    return
                }

                resolve()
            })
        })
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = FsBackend
