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

const Dexie = require("dexie")
const {Ajax, Text} = require("../../util")
const {ENTRANCE_SERVER_URL} = require("../../config")

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
        a.modifiedAt < b.modifiedAt ? +1 :
        a.modifiedAt > b.modifiedAt ? -1 :
        /* otherwise */ 0
    )
}

/**
 * It creates the connection which observes the room registory in the server.
 *
 * @param {string} knownRoomIds - The room ID list which this client has known.
 * @param {function} commit - The function to mutate the state of the store.
 * @returns {EventSource} The created connection.
 */
function createConnection(knownRoomIds, commit) {
    const sse = new window.EventSource(
        `${ENTRANCE_SERVER_URL}/rooms?with=${knownRoomIds.join(",")}`
    )

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
                for (const room of data.rooms) {
                    commit("roomRegistory/add", room)
                }
                commit("roomRegistory/changeStatus", {status: "ready"})
                break

            case "active":
                commit("roomRegistory/add", data.room)
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

    return sse
}

/**
 * It creates the DB which contains the rooms you had joined before.
 *
 * @param {function} commit - The function to mutate the state of the store.
 * @returns {Dexie} The created db.
 */
function createDB() {
    const db = new Dexie("roomRegistory")

    db.version(1).stores({ //
        rooms: "id",
    })

    return db
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
        knownRoomIds: new Set(),
    },

    mutations: {
        "roomRegistory/connect"(state, {sse, db, knownRoomIds}) {
            state.sse = sse
            state.db = db
            state.knownRoomIds = new Set(knownRoomIds)
            state.status = "connecting"
            state.error = null
        },

        "roomRegistory/disconnect"(state) {
            if (state.sse != null) {
                state.sse.close()
            }
            if (state.db != null) {
                state.db.close()
            }
            state.sse = null
            state.db = null
            state.status = "disconnected"
            state.error = null
            state.rooms.splice(0, state.rooms.length)
        },

        "roomRegistory/changeStatus"(state, {status, error}) {
            if (error != null) {
                if (state.sse != null) {
                    state.sse.close()
                    state.db.close()
                }
                state.status = "disconnected"
                state.error = error
                state.sse = null
                state.db = null
            }
            else {
                state.status = status
                state.error = null
            }
        },

        "roomRegistory/add"(state, room) {
            const i = state.rooms.findIndex(x => x.modifiedAt < room.modifiedAt)
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
                state.rooms.sort(byModifiedTime)
            }
        },
    },

    actions: {
        async connectRoomRegistory({commit, state}) {
            if (state.sse != null) {
                return
            }

            const db = createDB()
            const knownRooms = await db.rooms.toArray()
            const knownRoomIds = knownRooms.map(room => room.id)
            const sse = createConnection(knownRoomIds, commit)

            commit("roomRegistory/connect", {db, sse, knownRoomIds})
        },

        disconnectRoomRegistory({commit}) {
            commit("roomRegistory/disconnect")
        },

        createRoom({commit, state}, {name, description, password}) {
            return Ajax.request({
                method: "POST",
                path: `${ENTRANCE_SERVER_URL}/rooms`,
                data: {
                    name,
                    description,
                    password: Text.sha256(password),
                },
            })
        },

        updateRoom(
            {commit, state, rootState},
            {roomId, name, description, password}
        ) {
            const signals = rootState.playerRegistory.signals
            return Ajax.request({
                method: "PUT",
                path: `${ENTRANCE_SERVER_URL}/rooms/${roomId}`,
                password: signals && signals.peerId,
                data: {
                    name,
                    description,
                    password: Text.sha256(password),
                },
            })
        },

        async joinRoom(
            {commit, dispatch, state},
            {roomId, password, playerName}
        ) {
            // Open signaling channel for WebRTC.
            await dispatch("connectPlayerRegistory", {
                roomId,
                password,
                playerName,
            })

            // Mark this room as a known room.
            if (state.db != null) {
                await state.db.rooms.put({id: roomId})
                commit("roomRegistory/disconnect")
            }
            else {
                // Mark even if the room repository is inactive.
                const db = createDB()
                try {
                    await db.rooms.put({id: roomId})
                }
                finally {
                    db.close()
                }
            }
        },
    },
}
