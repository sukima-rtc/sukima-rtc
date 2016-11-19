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
const BackendBase = require("./backend-base")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The backend implementation by AWS S3.
 */
class S3Backend extends BackendBase {
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
    constructor(create, [accessKeyId, secretAccessKey, region, bucket, root]) {
        super()
        this.create = create
        this.s3 = new S3({accessKeyId, secretAccessKey, region})
        this.bucket = bucket
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
        const request = {
            Bucket: this.bucket,
            Key: path.join(this.root, id),
        }
        this.s3.getObject(request, (err, data) => {
            if (err == null) {
                resolve(data.Body.toString())
            }
            else if (err.statusCode === 404) {
                resolve(null)
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
        const request = {
            Bucket: this.bucket,
            Key: path.join(this.root, id),
            Body: body,
        }
        this.s3.putObject(request, (err) => {
            if (err == null) {
                resolve()
            }
            else {
                reject(err)
            }
        })
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = S3Backend
