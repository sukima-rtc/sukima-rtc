/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fs = require("fs")
const path = require("path")
const babelify = require("babelify")
const browserify = require("browserify")
const envify = require("envify")
const express = require("express")
const glob = require("glob")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "../../lib")
const FAVICON = path.join(ROOT, "favicon.ico")
const FONT = path.join(ROOT, "SourceHanCodeJP-Normal.otf")
const INDEX_HTML = path.join(ROOT, "index.html")
const INDEX_JS = path.join(ROOT, "index.js")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    startClientServer() {
        return new Promise((resolve, reject) => {
            const app = express()

            app.get("/favicon.ico", (req, res) => {
                res.sendFile(FAVICON)
            })
            app.get("/", (req, res) => {
                res.sendFile(INDEX_HTML)
            })
            app.get("/index.html", (req, res) => {
                res.sendFile(INDEX_HTML)
            })
            app.get("/SourceHanCodeJP-Normal.otf", (req, res) => {
                res.sendFile(FONT)
            })

            app.get("/index.js", (req, res) => {
                res.set("Content-Type", "application/javascript")
                browserify(INDEX_JS, {basedir: ROOT, debug: true})
                    .transform(babelify, {
                        babelrc: false,
                        plugins: [
                            "transform-async-to-generator",
                            "transform-vue-jsx",
                        ],
                        sourceMaps: "inline",
                    })
                    .transform(envify, {
                        //
                        ENTRANCE_SERVER_URL: "//localhost:3001",
                    })
                    .bundle()
                    .pipe(res)
            })

            app.get("/index.css", (req, res, next) => {
                res.set("Content-Type", "text/css")
                glob("**/*.css", {cwd: ROOT, absolute: true}, (err, files) => {
                    if (err) {
                        next(err)
                        return
                    }

                    (function nextFile() {
                        const file = files.shift()
                        if (file == null) {
                            res.end()
                            return
                        }

                        fs.createReadStream(file)
                            .on("error", next)
                            .on("end", nextFile)
                            .pipe(res, {end: false})
                    })()
                })
            })

            const server = app.listen(3000)
            server.on("listening", () => {
                resolve({
                    dispose() {
                        return new Promise(resolve2 => {
                            server.close(resolve2)
                        })
                    },
                })
            })
            server.on("error", reject)
        })
    },
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/*eslint-disable no-console, no-process-exit */

if (require.main === module) {
    require("../../../entrance-controller").then(
        () => {
            process.send({type: "ready"})
        },
        (err) => {
            console.error(err)
            process.exit(1)
        }
    )

    // Handle kill request.
    process.on("message", () => {
        process.exit(0)
    })
}

/*eslint-enable */
