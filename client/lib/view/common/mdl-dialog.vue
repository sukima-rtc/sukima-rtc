<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div class="mdl-dialog">
        <div v-if="titleShown" class="mdl-dialog__title">
            <slot name="title"></slot>
        </div>
        <div class="mdl-dialog__content">
            <slot></slot>
        </div>
        <div v-if="actionsShown" class="mdl-dialog__actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script>
"use strict"

/*globals window */

const KEY_ENTER = 13
const KEY_ESC = 27
const OK_BUTTON = ".mdl-dialog__actions button.mdl-button--primary"
const CANCEL_BUTTON = ".mdl-dialog__actions button:not(.mdl-button--primary)"

module.exports = {
    computed: {
        titleShown() {
            return Boolean(this.$slots.title)
        },
        actionsShown() {
            return Boolean(this.$slots.actions)
        },
    },

    methods: {
        handleKeys(event) {
            if (event.keyCode === KEY_ENTER) {
                const button = this.$el.querySelector(OK_BUTTON)
                if (button) {
                    button.click()
                }
            }
            if (event.keyCode === KEY_ESC) {
                const button = this.$el.querySelector(CANCEL_BUTTON)
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
</script>

<style scoped>
.mdl-dialog {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: space-between;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
}

.mdl-dialog__title {
    flex-grow: 0;
}

.mdl-dialog__content {
    flex-grow: 1;
    overflow-x: hidden;
    overflow-y: auto;
}

.mdl-dialog__actions {
    flex-grow: 0;
}

.mdl-dialog__actions button {
    margin-left: 4px;
}
</style>
