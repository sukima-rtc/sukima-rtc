/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Dexie = require("dexie")
const {Text} = require("../../util")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The database for chat.
 *
 *
 */
module.exports = class ChatDb {
    constructor(roomId) {
        this.db = new Dexie(`chat_${roomId}`)
        this.db.version(1).stores({
            // id: number
            // offsetTop: number
            // offsetBtm: number ... the height is around 2000
            // hash: string
            // icons: string[]
            // active: boolean
            pages: "id,&[offsetTop+offsetBtm],active",

            // id: string ....... the sha256 of icon and lines.
            // page: number
            // offset: number ... the offset from the top of the belonging page.
            // height: number
            // tick: number ..... epoch
            // icon: string ..... id of `icons` table.
            // lines: string[]
            messages: "id,page",

            // id: string  ... the sha256 of url.
            // url: string ... maybe a data-url.
            icons: "id",
        })
        this.db.open()
    }

    getPages(offset, height) {}

    getMessages(offset, height) {}

    getArchiveHashes() {}

    getOldestDifferentArcive(hashes) {}

    addMessage(message) {}

    merge(thatArchive) {}
}
