/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The base of backend classes.
 *
 * This class provides the cache of readers/writers promises.
 * Implement classes must have `create`, `read`, `write` methods.
 */
class BackendBase {
    /**
     * Creates a BackendBase instance.
     */
    constructor() {
        this.readers = new Map()
        this.writers = new Map()
    }

    /**
     * Gets the instance of the given ID.
     *
     * @param {string} id - The ID to get.
     * @returns {Promise<any>} The promise which becomes fulfilled when the reading has done.
     */
    get(id) {
        if (this.readers.has(id)) {
            return this.readers.get(id)
        }

        const reader = new Promise((resolve, reject) =>
            this.read(resolve, reject, id)
        )
        const dispose = () => {
            this.readers.delete(id)
        }

        this.readers.set(id, reader)
        reader.then(dispose, dispose)

        return reader.then(body => body && this.create(JSON.parse(body)))
    }

    /**
     * Sets the instance permanently.
     *
     * @param {string} id - The ID to write.
     * @param {any} instance - The object to write.
     * @returns {Promise<void>} The promise which becomes fulfilled when the writing has done.
     */
    set(id, instance) {
        const set = () => {
            const writer = new Promise((resolve, reject) =>
                this.write(resolve, reject, id, JSON.stringify(instance))
            )
            const dispose = () => {
                if (this.writers.get(id) === writer) {
                    this.writers.delete(id)
                }
            }

            this.writers.set(id, writer)
            writer.then(dispose, dispose)

            return writer
        }

        const prevWriter = this.writers.get(id)
        return prevWriter ? prevWriter.then(set, set) : set()
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = BackendBase
