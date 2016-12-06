/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const path = require("path")
const S3 = require("aws-sdk/clients/s3")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The backend implementation by AWS S3.
 */
class S3BackendImpl {
    /**
     * Creates a S3Backend instance.
     *
     * @param {function} create - The function to create model instance.
     * @param {string[]} args - The arguments.
     * @param {string} args.0 - The access key ID to access S3.
     * @param {string} args.1 - The secret access key to access S3.
     * @param {string} args.2 - The region of S3.
     * @param {string} args.3 - The bucket ID.
     * @param {string} args.4 - The root directory in the bucket.
     */
    constructor([accessKeyId, secretAccessKey, region, bucket, root]) {
        this.s3 = new S3({accessKeyId, secretAccessKey, region})
        this.bucket = bucket
        this.root = root
    }

    /**
     * Read data from a file.
     *
     * @param {string} id - The ID to read.
     * @param {function} cb - The function to be called if finished.
     * @returns {void}
     */
    get(id, cb) {
        this.s3.getObject(
            {
                Bucket: this.bucket,
                Key: path.join(this.root, id),
            },
            (err, data) => {
                if (err == null) {
                    cb(null, data.Body.toString())
                }
                else if (err.statusCode === 404) {
                    cb(null, null)
                }
                else {
                    cb(err)
                }
            }
        )
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
        this.s3.putObject(
            {
                Bucket: this.bucket,
                Key: path.join(this.root, id),
                Body: data,
            },
            cb
        )
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = S3BackendImpl
