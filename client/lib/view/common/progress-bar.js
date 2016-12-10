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
    name: "ProgressBar",

    mixins: [MdlUtils.mixin()],
    props: {indeterminate: {type: Boolean, default: false}},

    computed: {
        cssClasses() {
            return {
                "mdl-progress": true,
                "mdl-js-progress": true,
                "mdl-progress__indeterminate": this.indeterminate,
            }
        },
    },

    render(h) {
        return <div class={this.cssClasses} style="width:100%"></div>
    },
}
