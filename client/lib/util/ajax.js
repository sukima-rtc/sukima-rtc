/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals XMLHttpRequest */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ENCODED_CHARS = /%[0-9A-F]{2}/g

/**
 * It parses the given text as JSON string.
 *
 * @param {string} text - The text to be parsed.
 * @returns {any} The result of parsing.
 */
function parseJSON(text) {
    try {
        return text ? JSON.parse(text) : null
    }
    catch (err) {
        return {error: text || err.message}
    }
}

/**
 * It calculates bytes of the given text.
 *
 * @param {string} text - The text to be calculated.
 * @returns {number} The result of calculating.
 */
function byteLength(text) {
    return encodeURIComponent(text).replace(ENCODED_CHARS, ".").length
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    /**
     * It sends an ajax request.
     *
     * @param {object} config - The configuration of the request.
     * @param {string} config.method - The method.
     * @param {string} config.path - The path.
     * @param {string} [config.password] - The password to be used for authorization..
     * @param {any} [config.data] - The request body.
     * @returns {Promise<any>} The promise which will be fulfilled if the request finished.
     */
    request({method, path, password, data}) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()

            xhr.onerror = () => {
                reject(new Error("Network Error"))
            }
            xhr.onload = () => {
                const status = xhr.status
                const resData = parseJSON(xhr.responseText)

                if (status >= 200 &&
                    status < 300 &&
                    (resData == null || resData.error == null)
                ) {
                    resolve(resData)
                }
                else {
                    const error = new Error(
                        (resData && resData.error) || xhr.statusText
                    )
                    error.statusCode = status
                    error.statusText = xhr.statusText
                    reject(error)
                }
            }

            const dataText = data && JSON.stringify(data)

            xhr.open(method, path, true)
            xhr.setRequestHeader("Accept", "application/json")
            xhr.setRequestHeader("Accept-Charset", "UTF-8")
            if (password) {
                xhr.setRequestHeader("Authorization", `Bearer ${password}`)
            }
            if (dataText) {
                xhr.setRequestHeader("Content-Length", byteLength(dataText))
                xhr.setRequestHeader("Content-Type", "application/json")
            }
            xhr.send(dataText)
        })
    },
}
