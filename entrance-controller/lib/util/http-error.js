/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {STATUS_CODES} = require("http")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The error type for HTTP.
 */
class HttpError extends Error {
    /**
     * New a HttpError instance.
     *
     * @param {number} status - The status code.
     * @param {string} message - The error message.
     */
    constructor(status, message) {
        super(message || STATUS_CODES[status] || "Unknown Error")

        this.status = status
        this.noMessage = !message
    }

    /**
     * Creates a new HttpError instance.
     *
     * @param {number} [status=500] - The status code.
     * @param {string} [message=http.STATUS_CODES[status]] - The error message.
     * @returns {HttpError} The new HttpError instance.
     */
    static new(status = 500, message) {
        return new HttpError(status, message)
    }

    /**
     * Creates a new HttpError instance which is boxed in a Promise.
     *
     * @param {number} [status=500] - The status code.
     * @param {string} [message=http.STATUS_CODES[status]] - The error message.
     * @returns {Promise<HttpError>} The new HttpError instance.
     */
    static reject(status = 500, message) {
        return Promise.reject(new HttpError(status, message))
    }

    /**
     * Handles thrown errors.
     *
     * @returns {function} The middleware to handle thrown errors.
     */
    static handle() {
        return (err, req, res, next) => {
            if (err instanceof HttpError) {
                if (!err.noMessage && req.accepts("application/json")) {
                    res.status(err.status).json({error: err.message})
                    return
                }
                if (!err.noMessage && req.accepts("text")) {
                    res.status(err.status).send(err.message)
                    return
                }
                res.status(err.status).end()
                return
            }
            next(err)
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = HttpError
