/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Vue = require("vue")
const VueRouter = require("vue-router")
const LoginRoomDialog = require("./room-select/login-room-dialog.vue")
const NewRoomDialog = require("./room-select/new-room-dialog.vue")
const SelectRoomDialog = require("./room-select/select-room-dialog.vue")

Vue.use(VueRouter)

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    createRouter(store) {
        const router = new VueRouter({
            routes: [
                {path: "/", redirect: "/rooms"},
                {path: "/rooms", component: SelectRoomDialog},
                {path: "/rooms/new", component: NewRoomDialog},
                // {path: "/rooms/:id/edit", component: EditRoomDialog, name: "edit"},
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

        return router
    },
}
