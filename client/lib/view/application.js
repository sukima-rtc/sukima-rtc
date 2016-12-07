/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    data() {
        return {}
    },

    computed: {
        dialogShown() {
            return this.$route.params.channel == null
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
        </div>
    },
}
