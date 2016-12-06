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

/**
 * The implementation which does nothing.
 */
class NoneBackendImpl {
    /**
     * Does nothing.
     * @returns {Promise} A fulfilled promise.
     */
    get() { //eslint-disable-line class-methods-use-this
        return NONE_PROMISE
    }

    /**
     * Does nothing.
     * @returns {Promise} A fulfilled promise.
     */
    set() { //eslint-disable-line class-methods-use-this
        return NONE_PROMISE
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = NoneBackendImpl
