<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div class="sukima-application mdl-layout mdl-js-layout mdl-layout--fixed-header">
        <div :class="cssClasses">
            <header class="mdl-layout__header">
                <div class="mdl-layout__header-row">
                    <span class="mdl-layout__title">スキマRTC</span>
                </div>
            </header>
            <main class="mdl-layout__content">
                <sukima-chat></sukima-chat>
                <div>Good Morning, Yukari❤</div>
            </main>
        </div>
        <div v-show="dialogShown" class="dialog-container">
            <router-view></router-view>
        </div>
        <mdl-snackbar ref="errorSnackbar"></mdl-snackbar>
    </div>
</template>

<script>
"use strict"

const Vue = require("vue")
const createStore = require("../store").createStore
const MdlUtils = require("./common/mdl-utils")
const createRouter = require("./router").createRouter

Vue.use(vue => {
    vue.prototype.$showError = function(message) {
        this.$parent.$showError(message)
    }
})

// Setup the store and the router.
const store = createStore()
const router = createRouter(store)

module.exports = {
    components: {
        "sukima-chat": require("./chat/index.vue"),
        "mdl-snackbar": require("./common/mdl-snackbar.vue"),
    },
    mixins: [MdlUtils.mixin()],
    store,
    router,

    data() {
        return {}
    },

    computed: {
        signalingChannel() {
            return this.$store.state.playerRegistory.signals
        },
        dialogShown() {
            return this.signalingChannel == null
        },
        cssClasses() {
            return {
                "mdl-layout": true,
                "mdl-js-layout": true,
                "blur": this.dialogShown,
            }
        },
    },

    methods: {
        $showError(message) {
            this.$refs.errorSnackbar.show(message)
        },
    },
}
</script>

<style scoped>
main {
    display: flex;
    align-items: stretch;
}

main >:first-child {
    flex-shrink: 0;
}
main >:last-child {
    flex-grow: 1;
    flex-shrink: 1;
}

.blur {
    box-sizing: border-box;
    -webkit-filter: blur(3px);
    filter: blur(3px);
    border: 4px solid white;
    pointer-events: none;
}

.dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.dialog-container > * {
    position: fixed;
    top: 45%;
    left: 50%;
    width: 75%;
    max-height: 75%;
    max-width: 800px;
    min-width: 440px;
    transform: translate(-50%, -50%);
}
</style>
