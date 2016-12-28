<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div :class="cssClasses">
        <input
            class="mdl-textfield__input"
            :autofocus="autofocus"
            :disabled="disabled"
            :id="id"
            :maxlength="maxlength"
            :required="required"
            :tabindex="tabIndex"
            :type="inputType"
            :value="value"
            @input="handleInput"
        />
        <label class="mdl-textfield__label" :for="id">{{label}}</label>
    </div>
</template>

<script>
"use strict"

const MdlUtils = require("./mdl-utils")
const IdGenerator = {
    nextId: 0,
    next() {
        return `textfield${this.nextId++}`
    },
}

module.exports = {
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

    data() {
        return {id: IdGenerator.next()}
    },

    computed: {
        inputType() {
            return this.password ? "password" : "text"
        },

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
}
</script>
