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
        accent: {
            type: Boolean,
            default: false,
            required: false,
        },
        colored: {
            type: Boolean,
            default: false,
            required: false,
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false,
        },
        fab: {
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
                "mdl-button": true,
                "mdl-js-button": true,
                "mdl-button--icon": this.icon,
                "mdl-button--accent": this.accent,
                "mdl-button--primary": this.primary,
                "mdl-button--mini-fab": this.miniFab,
                "mdl-button--fab": this.fab || this.miniFab,
                "mdl-button--raised": this.raised,
                "mdl-button--colored": this.colored,
            }
        },
    },

    render(h) {
        return <button class={this.cssClasses} disabled={this.disabled}>
            {this.icon ? <Icon kind={this.icon}/> : null}
            {this.$children}
        </button>
    },
}
