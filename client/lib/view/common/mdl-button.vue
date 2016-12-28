<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <button :class="cssClasses" :disabled="disabled" :tabindex="tabIndex" @click="handleClick">
        <mdl-icon v-if="icon" :kind="icon"></mdl-icon>
        <slot></slot>
    </button>
</template>

<script>
"use strict"

const MdlUtils = require("./mdl-utils")

module.exports = {
    components: { //
        "mdl-icon": require("./mdl-icon.vue"),
    },
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

    methods: {
        handleClick(event) {
            this.$emit("click", event)
        },

        click() {
            this.$el.click()
        },
    },
}
</script>
