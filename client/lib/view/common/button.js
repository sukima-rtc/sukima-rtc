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
    name: "Button",

    mixins: [MdlUtils.mixin()],
    props: {
        accent: {type: Boolean, default: false},
        colored: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false},
        fab: {type: Boolean, default: false},
        icon: {type: String, default: undefined},
        miniFab: {type: Boolean, default: false},
        primary: {type: Boolean, default: false},
        raised: {type: Boolean, default: false},
        tabIndex: {type: Number, default: undefined},
    },

    computed: {
        cssClasses() {
            return {
                "mdl-button": true,
                "mdl-js-button": true,
                "mdl-js-ripple-effect": true,
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
        return <button
            class={this.cssClasses}
            disabled={this.disabled}
            tabindex={this.tabIndex}
            onClick={this.handleClick}
        >
            {this.icon ? <Icon kind={this.icon}/> : null}
            {this.$slots.default}
        </button>
    },

    methods: {
        handleClick(event) {
            this.$emit("click", event)
        },
    },
}
