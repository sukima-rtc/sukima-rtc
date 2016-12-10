/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {Snackbar} = require("./common")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const PATH_PATTERN = /^\/rooms\/[0-9a-zA-Z]{12}$/

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "SukimaApplication",

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
    },

    render(h) {
        return <div class="sukima-application">
            <div
                class={{
                    "mdl-layout": true,
                    "mdl-js-layout": true,
                    "sukima-application--blur": this.dialogShown,
                }}
            >
                <header class="mdl-layout__header">
                    <div class="mdl-layout__header-row">
                        <span class="mdl-layout__title">スキマ<sub>RTC</sub></span>
                    </div>
                </header>
                <main class="mdl-layout__content">
                    <div>Good Morning, Yukari❤</div>
                </main>
            </div>
            <div v-show="dialogShown" class="sukima-application__dialog-container">
                <router-view></router-view>
            </div>
            <Snackbar ref="errorSnackbar" class="sukima-application__error-snackbar"/>
        </div>
    },

    methods: {
        $showError(message) {
            this.$refs.errorSnackbar.show(message)
        },
    },

    created() {
        this.$router.beforeEach((to, from, next) => {
            if (PATH_PATTERN.test(to.path) && this.signalingChannel == null) {
                next(`${to.path}/login`)
            }
            else {
                next()
            }
        })
        this.$router.afterEach((to, from) => {
            if (from === this.$route) {
                this.$store.dispatch("disconnectPlayerRegistory")
            }
        })
    },
}
