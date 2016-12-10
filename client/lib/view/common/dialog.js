/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals window */

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "Dialog",

    render(h) {
        return <div class="mdl-dialog">
            <div class="mdl-dialog__title" v-show={Boolean(this.$slots.title)}>
                {this.$slots.title}
            </div>
            <div class="mdl-dialog__content">
                {this.$slots.default}
            </div>
            <div class="mdl-dialog__actions" v-show={Boolean(this.$slots.actions)}>
                {this.$slots.actions}
            </div>
        </div>
    },

    methods: {
        handleKeys(event) {
            if (event.keyCode === 13) {
                const button = this.$el.querySelector(".mdl-dialog__actions button.mdl-button--primary")
                if (button) {
                    button.click()
                }
            }
            else if (event.keyCode === 27) {
                const button = this.$el.querySelector(".mdl-dialog__actions button:not(.mdl-button--primary)")
                if (button) {
                    button.click()
                }
            }
        },
    },

    mounted() {
        window.addEventListener("keyup", this.handleKeys)
    },

    beforeDestroy() {
        window.removeEventListener("keyup", this.handleKeys)
    },
}
