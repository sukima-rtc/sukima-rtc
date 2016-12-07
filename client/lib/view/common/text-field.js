/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Icon = require("./icon")
const MdlUtils = require("./mdl-utils")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    mixins: [MdlUtils.mixin()],
    props: {
        float: {
            type: Boolean,
            default: false,
            required: false,
        },
        invalid: {
            type: Boolean,
            default: false,
            required: false,
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false,
        },
        password: {
            type: Boolean,
            default: false,
            required: false,
        },
        password: {
            type: Boolean,
            default: false,
            required: false,
        },
        icon: {type: String},
        miniFab: {
            type: Boolean,
            default: false,
            required: false,
        },
        primary: {
            type: Boolean,
            default: false,
            required: false,
        },
        raised: {
            type: Boolean,
            default: false,
            required: false,
        },
    },

    computed: {
        cssClasses() {
            return {
                "mdl-textfield": true,
                "mdl-js-textfield": true,
                "mdl-textfield--floating-label": this.float,
                "is-invalid": this.invalid,
            }
        },
        inputKind() {
            return this.password ? "password" : "text"
        },
    },

    render(h) {
        return <div class={this.cssClasses}>
            <input class="mdl-textfield__input" type={this.inputKind} id={this.id} pattern={this.pattern}/>
            <label class="mdl-textfield__label" for={this.id}>{this.label}</label>
            <span class="mdl-textfield__error">{this.patternError}</span>
        </div>
    },
}
