/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals window */

const Vue = require("vue")
const VueRouter = require("vue-router")
const VueX = require("vuex")
const StoreOptions = require("./store")
const {
    Application,
    EditRoomDialog,
    LoginRoomDialog,
    NewRoomDialog,
    SelectRoomDialog,
} = require("./view")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

Vue.use(VueRouter)
Vue.use(VueX)
Vue.use(vue => {
    vue.prototype.$showError = function(message) {
        this.$parent.$showError(message)
    }
})

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection
const EventSource = window.EventSource
if (RTCPeerConnection != null && EventSource != null) {
    // Setup the store and the router.
    const store = new VueX.Store(StoreOptions)
    const router = new VueRouter({
        routes: [
            {path: "/", redirect: "/rooms"},
            {path: "/rooms", component: SelectRoomDialog},
            {path: "/rooms/new", component: NewRoomDialog},
            {path: "/rooms/:id/edit", component: EditRoomDialog, name: "edit"},
            {path: "/rooms/:id/login", component: LoginRoomDialog},
            {path: "/rooms/:id", component: null, name: "main"},
        ],
    })

    // Setup navigation guards for login/logout.
    router.beforeEach((to, from, next) => {
        if ((
                (to.name && !from.name) ||
                (to.name && from.name && to.params.id !== from.params.id)
            ) &&
            !store.state.playerRegistory.signals
        ) {
            // others → (main or edit) AND signaling channel is null.
            // in this case, it needs to login.
            next(`${to.path.replace("/edit", "")}/login`)
        }
        else {
            next()
        }
    })
    router.afterEach((to, from) => {
        if ((
                (!to.name && from.name) ||
                (to.name && from.name && to.params.id !== from.params.id)
            ) &&
            store.state.playerRegistory.signals
        ) {
            // (main or edit) → others AND signaling channel is not null.
            // in this case, it needs to disconnect.
            store.dispatch("disconnectPlayerRegistory")
        }
    })

    // Setup the view.
    new Vue(Object.assign(
        {router, store},
        Application
    )).$mount("#mainArea")

    window.sukimaRTCLoaded = true
}
