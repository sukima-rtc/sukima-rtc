/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Player = require("./player")
const SignalingChannel = require("./signaling-channel")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    state: {
        name: null,
        signals: null,
        players: new Map(),
    },

    mutations: {
        "playerRegistory/updateName"(state, name) {
            state.name = name
        },

        "playerRegistory/connect"(state, signals) {
            state.signals = signals
        },

        "playerRegistory/disconnect"(state) {
            if (state.signals != null) {
                state.signals.dispose()
                state.signals = null
                state.players.splice(0, state.players.length)
            }
        },

        "playerRegistory/add"(state, {peerId, description}) {
            const player = new Player(
                peerId,
                description,
                state.signals,
                state.name
            )
            state.players.set(peerId, player)
        },

        "playerRegistory/remove"(state, {peerId}) {
            const player = state.players.get(peerId)
            if (player != null) {
                player.dispose()
                state.players.delete(peerId)
            }
        },

        "playerRegistory/setIceCandidate"(state, {peerId, candidate}) {
            const player = state.players.get(peerId)
            if (player != null) {
                player.setIceCandidate(candidate)
            }
        },

        "playerRegistory/setRemoteDescription"(state, {peerId, description}) {
            const player = state.players.get(peerId)
            if (player != null) {
                player.setRemoteDescription(description)
            }
        },
    },

    actions: {
        async connectPlayerRegistory(
            {commit, state},
            {roomId, password, playerName}
        ) {
            if (state.signals != null) {
                return
            }
            commit("playerRegistory/updateName", playerName)

            const signals = await SignalingChannel.connect(
                roomId,
                password,
                commit
            )
            commit("playerRegistory/connect", signals)
        },

        disconnectPlayerRegistory({commit}) {
            commit("playerRegistory/disconnect")
        },
    },
}
