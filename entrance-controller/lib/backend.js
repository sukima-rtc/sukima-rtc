/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const NONE_PROMISE = Promise.resolve(null)
const noneBackend = Object.freeze({
    get: () => NONE_PROMISE,
    set: () => NONE_PROMISE,
})

/**
 * The static class to search backend implementation.
 */
class Backend {
    /**
     * Gets the backend implementation.
     *
     * @param {function} create - The function to create a model instance.
     * @param {string[]} args - The arguments for backend implementation.
     * @returns {{get: function, set: function}} The backend implementation.
     */
    static getBackend(create, [type, ...args]) {
        switch (type) {
            case "fs":
            case "s3": {
                const BackendImpl = require(`./backend/${type}`)
                return new BackendImpl(create, args)
            }

            case "none":
                return noneBackend

            default:
                throw new Error(`INVALID BACKEND TYPE: ${type}`)
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Backend
