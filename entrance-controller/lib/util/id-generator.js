/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const HttpError = require("./http-error")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const BASE = CHARS.length
const COUNT_MAX = Math.pow(BASE, 3) - 1
const ID_PATTERN = /^[0-9a-zA-Z]{12}$/

/**
 * Calculates the checksum of the given ID.
 *
 * @param {string[]|string} id - The ID to calculate.
 * @returns {string} The checksum.
 */
function calcCheckSum(id) {
    let sum = 0

    for (let i = 0, end = id.length - 1; i < end; ++i) {
        sum += id[i].charCodeAt(0)
    }

    return CHARS[sum % BASE]
}

/**
 * The unique string generator.
 */
class IdGenerator {
    /**
     * Creates a new IdGenerator instance.
     */
    constructor() {
        this.buffer = Object.preventExtensions(Array.from("0123456789ab"))
        this.length = this.buffer.length
        this.count = 0
        this.lastTick = 0
    }

    /**
     * Generates an ID.
     *
     * @returns {string} ID. This is 12 characters in base62.
     */
    nextId() {
        const tick = Date.now()

        if (tick !== this.lastTick) {
            this.count = 0
            this.lastTick = tick
        }
        else if (this.count >= COUNT_MAX) {
            // Received too many requests (238328) in a millisecond.
            return HttpError.new(503)
        }
        else {
            this.count += 1
        }

        this._encode(tick, 0, 7)
        this._encode(this.count, 8, 10)
        this.buffer[11] = calcCheckSum(this.buffer)
        return this.buffer.join("")
    }

    /**
     * Checks whether the given ID is valid format or not.
     *
     * @param {string} id - The ID to check.
     * @returns {boolean} `true` if the id is valid.
     */
    isValidId(id) {  //eslint-disable-line class-methods-use-this
        return (
            typeof id === "string" &&
            ID_PATTERN.test(id) &&
            id[11] === calcCheckSum(id)
        )
    }

    /**
     * Makes a base62 string on the buffer
     *
     * @param {number} value - The value to encode.
     * @param {number} first - The first index in the buffer to encode the value.
     * @param {number} last - The last index in the buffer to encode the value.
     * @returns {void}
     * @private
     */
    _encode(value, first, last) {
        for (let i = last, n = value; i >= first; --i) {
            if (n === 0) {
                this.buffer[i] = "0"
            }
            else {
                this.buffer[i] = CHARS[n % BASE]
                n = Math.floor(n / BASE)
            }
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = new IdGenerator()
