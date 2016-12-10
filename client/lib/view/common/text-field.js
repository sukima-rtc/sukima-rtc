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
// Helpers
//------------------------------------------------------------------------------

const IdMap = {
    nextId: 0,
    map: new WeakMap(),

    getId(element) {
        let id = this.map.get(element)
        if (id == null) {
            id = `textfield${this.nextId++}`
            this.map.set(element, id)
        }
        return id
    },
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "TextField",

    mixins: [MdlUtils.mixin()],

    props: {
        autofocus: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false},
        float: {type: Boolean, default: false},
        label: {type: String, default: ""},
        password: {type: Boolean, default: false},
        maxlength: {type: Number, default: undefined},
        required: {type: Boolean, default: false},
        tabIndex: {type: Number, default: undefined},
        value: {type: String, default: ""},
    },

    computed: {
        cssClasses() {
            return {
                "mdl-textfield": true,
                "mdl-js-textfield": true,
                "mdl-textfield--floating-label": this.float,
            }
        },
    },

    methods: {
        handleInput(event) {
            this.$emit("input", event.target.value)
        },
    },

    render(h) {
        const id = IdMap.getId(this)

        return <div class={this.cssClasses}>
            <input
                autofocus={this.autofocus}
                class="mdl-textfield__input"
                disabled={this.disabled}
                id={id}
                maxlength={this.maxlength}
                required={this.required}
                tabindex={this.tabIndex}
                type={this.password ? "password" : "text"}
                value={this.value}
                onInput={this.handleInput}
            />
            <label class="mdl-textfield__label" for={id}>{this.label}</label>
        </div>
    },
}
