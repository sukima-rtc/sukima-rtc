/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const MdlUtils = require("./mdl-utils")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "Snackbar",

    mixins: [MdlUtils.mixin()],
    props: {
        icon: {type: String, default: undefined},
        text: {type: String, default: undefined},
    },

    render(h) {
        return <div class="mdl-snackbar mdl-js-snackbar">
            <div class="mdl-snackbar__text"></div>
            <button class="mdl-snackbar__action" type="button"></button>
        </div>
    },

    methods: {
        show(message) {
            this.$el.MaterialSnackbar.showSnackbar({
                message,
                timeout: 4000,
            })
        },
    },
}
