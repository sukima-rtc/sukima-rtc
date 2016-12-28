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
const Application = require("./view/application.vue")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection
const EventSource = window.EventSource
if (RTCPeerConnection != null && EventSource != null) {
    new Vue({
        functional: true,
        render(h) {
            return h(Application)
        },
    }).$mount("#mainArea")

    window.sukimaRTCLoaded = true
}
