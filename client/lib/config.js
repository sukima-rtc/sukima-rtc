/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------
/*eslint-disable no-process-env */
/*globals process */

module.exports = {
    /**
     * The URL of entrance control server.
     * @type {string}
     */
    ENTRANCE_SERVER_URL: process.env.ENTRANCE_SERVER_URL || "//localhost",

    /**
     * NODE_ENV.
     * @type {string}
     */
    ENV: process.env.NODE_ENV || "development",
}

/*eslint-enable */
