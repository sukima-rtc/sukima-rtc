/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    functional: true,

    render(h, context) {
        const s = context.slots()
        return <div class="mdl-dialog sukima-dialog">
            <div
                class="mdl-dialog__title sukima-dialog__title"
                v-show={Boolean(s.title)}
            >{
                s.title
            }</div>
            <div class="mdl-dialog__content sukima-dialog__content">{
                s.default
            }</div>
            <div
                class="mdl-dialog__actions sukima-dialog__actions"
                v-show={Boolean(s.actions)}
            >{
                s.actions
            }</div>
        </div>
    },
}
