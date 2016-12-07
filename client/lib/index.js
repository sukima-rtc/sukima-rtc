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
    SelectRoomDialog,
    NewRoomDialog,
    EditRoomDialog,
    LoginRoomDialog,
} = require("./view")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

Vue.use(VueRouter)
Vue.use(VueX)

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection
const EventSource = window.EventSource
if (RTCPeerConnection != null && EventSource != null) {
    new Vue({
        store: new VueX.Store(StoreOptions),
        router: new VueRouter({
            routes: [
                {path: "/", redirect: "/rooms"},
                {
                    path: "/rooms",
                    component: Application,
                    children: [
                        {path: "", component: SelectRoomDialog},
                        {path: "new", component: NewRoomDialog},
                        {path: ":id/edit", component: EditRoomDialog},
                        {path: ":id", component: LoginRoomDialog},
                    ],
                },
            ],
        }),
    }).$mount("#mainArea")

    window.sukimaRTCLoaded = true
}
