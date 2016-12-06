/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const LruCache = require("lru-cache")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The static class to search backend implementation.
 */
class Backend {
    /**
     * Gets the backend implementation.
     *
     * @param {function} createInstance - The function to create a model
     *  instance from a plain object.
     * @param {string[]} args - The arguments for backend implementation.
     * @returns {Backend} The backend implementation.
     */
    static getBackend(createInstance, [type, ...args]) {
        try {
            const Impl = require(`./backend/${type}`)
            return new Backend(createInstance, new Impl(args))
        }
        catch (err) {
            if (err.code === "MODULE_NOT_FOUND") {
                throw new Error(`INVALID BACKEND TYPE: "${type}"`)
            }
            throw err
        }
    }

    /**
     * Creates a Backend instance.
     *
     * @param {function} createInstance - The function to create a model
     *  instance from a plain object.
     * @param {{get: function, set: function}} impl - The backend
     *  implementation.
     */
    constructor(createInstance, impl) {
        this.impl = impl
        this.rPromise = new LruCache(1024)
        this.wQueue = new Map()
        this.createInstance = createInstance
    }

    /**
     * Gets the instance of the given ID from this backend.
     *
     * @param {any} id - The ID to get.
     * @returns {Promise<any>} The gotten instance.
     */
    get(id) {
        return this.rPromise.get(id) || this._getImpl(id)
    }

    /**
     * Sets the instance to this backend.
     *
     * @param {any} id - The ID to set.
     * @param {any} instance - The instance to be set.
     * @returns {Promise<any>} The promise which is fulfilled if finished.
     */
    set(id, instance) {
        const wInfo = this.wQueue.get(id)
        if (wInfo != null) {
            wInfo.instance = instance

            if (wInfo.promise == null) {
                wInfo.promise = new Promise((resolve, reject) => {
                    wInfo.resolve = resolve
                    wInfo.reject = reject
                })
                this.rPromise.set(
                    id,
                    wInfo.promise.catch(() => this._getImpl(id))
                )
            }

            return wInfo.promise
        }
        return new Promise((resolve, reject) => {
            this._setImpl(id, instance, resolve, reject)
        })
    }

    /**
     * Gets the instance of the given ID from this backend.
     *
     * @param {any} id - The ID to get.
     * @returns {Promise<any>} The gotten instance.
     * @private
     */
    _getImpl(id) {
        const promise = new Promise((resolve, reject) => {
            const done = (err, instance) => {
                if (err == null) {
                    resolve(instance)
                }
                else {
                    this.rPromise.del(id)
                    reject(err)
                }
            }

            this.impl.get(id, (gettingError, data) => {
                try {
                    done(
                        gettingError,
                        data && this.createInstance(JSON.parse(data))
                    )
                }
                catch (parsingError) {
                    done(parsingError)
                }
            })
        })
        this.rPromise.set(id, promise)

        return promise
    }

    /**
     * Sets the instance to this backend.
     *
     * @param {any} id - The ID to set.
     * @param {any} instance - The instance to be set.
     * @param {function} resolve - The function to be call if succeeded.
     * @param {function} reject - The function to be call if failed.
     * @returns {Promise<any>} The promise which is fulfilled if finished.
     */
    _setImpl(id, instance, resolve, reject) {
        const wInfo = {
            instance: null,
            promise: null,
            reject: null,
            resolve: null,
        }
        this.wQueue.set(id, wInfo)

        const done = (err) => {
            if (err == null) {
                resolve(instance)
            }
            else {
                reject(err)
            }

            // Execute queue
            if (wInfo.promise == null) {
                this.wQueue.delete(id)
            }
            else {
                this._setImpl(id, wInfo.instance, wInfo.resolve, wInfo.reject)
                wInfo.instance = null
                wInfo.promise = null
                wInfo.reject = null
                wInfo.resolve = null
            }
        }

        try {
            const data = JSON.stringify(instance)
            this.impl.set(id, data, done)
        }
        catch (err) {
            done(err)
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Backend
