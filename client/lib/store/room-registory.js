/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals EventSource */

const {ENTRANCE_SERVER_URL} = require("./config")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * It compares given two rooms by the the last modified time.
 *
 * @param {object} a - A room object to be compared.
 * @param {object} b - A room object to be compared.
 * @returns {number} The result of comparing.
 */
function byModifiedTime(a, b) {
    return (
        a.modifiedAt < b.modifiedAt ? -1 :
        a.modifiedAt > b.modifiedAt ? +1 :
        /* otherwise */ 0
    )
}

function createConnection(commit) {
    const sse = new EventSource(`${ENTRANCE_SERVER_URL}/rooms`)

    sse.onopen = () => {
        commit("roomRegistory/changeStatus", {status: "connected"})
    }
    sse.onerror = () => {
        const error = new Error("Failed to connect")
        commit("roomRegistory/changeStatus", {error})
    }
    sse.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
            case "ready":
                commit("roomRegistory/reset", data.rooms)
                commit("roomRegistory/changeStatus", {status: "ready"})
                break

            case "active":
                commit("roomRegistory/insert", data.room)
                break
            case "inactive":
                commit("roomRegistory/remove", data.room)
                break
            case "update":
                commit("roomRegistory/update", data.room)
                break

            // no default
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    state: {
        // One of "disconnected", "connecting", "connected", "ready".
        status: "disconnected",
        error: null,
        rooms: [],
    },

    mutations: {
        "roomRegistory/connect"(state, sse) {
            state.sse = sse
            state.status = "connecting"
            state.error = null
        },

        "roomRegistory/disconnect"(state) {
            if (state.sse != null) {
                state.sse.close()
            }
            state.sse = null
            state.status = "disconnected"
            state.error = null
        },

        "roomRegistory/changeStatus"(state, {status, error}) {
            if (error != null) {
                state.status = "disconnected"
                state.error = error
                state.sse = null
            }
            else {
                state.status = status
                state.error = null
            }
        },

        "roomRegistory/reset"(state, rooms) {
            state.rooms = rooms.sort(byModifiedTime)
            state.rooms.push({id: "aaaa", name: "博麗神社", description: "テスト部屋 1", createdAt: "", modifiedAt: "", players: 3})
            state.rooms.push({id: "bbbb", name: "魔法の森", description: "テスト部屋 2", createdAt: "", modifiedAt: "", players: 0})
            state.rooms.push({id: "cccc", name: "紅魔館", description: "テスト部屋 3", createdAt: "", modifiedAt: "", players: 2})
        },

        "roomRegistory/insert"(state, room) {
            const i = state.rooms.findIndex(x => x.modifiedAt > room.modifiedAt)
            if (i !== -1) {
                state.rooms.splice(i, 0, room)
            }
            else {
                state.rooms.push(room)
            }
        },

        "roomRegistory/remove"(state, room) {
            const i = state.rooms.findIndex(x => x.id === room.id)
            if (i !== -1) {
                state.rooms.splice(i, 1)
            }
        },

        "roomRegistory/update"(state, room) {
            const i = state.rooms.findIndex(x => x.id === room.id)
            if (i !== -1) {
                state.rooms.splice(i, 1, room)
                state.rooms.sort(bymodifiedTime)
            }
        },
    },

    actions: {
        connectRoomRegistory({commit, state}) {
            if (state.sse == null) {
                commit("roomRegistory/connect", {sse: createConnection(commit)})
            }
        },

        disconnectRoomRegistory({commit}) {
            commit("roomRegistory/disconnect")
        },

        async loginRoom({commit, state}, {playerName, roomId, password}) {
            const signalingChannel = await SignalingChannel.connect(playerName, roomId, password)
            commit("roomRegistory/disconnect")

            return signalingChannel
        },

        async createRoom({commit, state}, {playerName, name, description, password}) {
        },
    },
}
