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

const {Ajax, Text} = require("../../util")
const {ENTRANCE_SERVER_URL} = require("../../config")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The signaling channel.
 */
module.exports = class SignalingChannel {
    /**
     * @param {string} roomId - The room ID to connect.
     * @param {string} password - The room password to connect.
     * @param {function} commit - The function to mutate the store's state.
     * @returns {Promise<SignalingChannel>} The promise which become fulfilled
     *  if connecting succeeded.
     */
    static connect(roomId, password, commit) {
        return new SignalingChannel(roomId, password, commit).ready
    }

    /**
     * @param {string} roomId - The room ID to connect.
     * @param {string} password - The room password to connect.
     * @param {function} commit - The function to mutate the store's state.
     */
    constructor(roomId, password, commit) {
        this.url = `${ENTRANCE_SERVER_URL}/rooms/${roomId}/signals`
        this.sse = new EventSource(`${this.url}?${Text.sha256(password)}`)
        this.status = "connecting"
        this.peerId = null
        this.error = null
        this.ready = new Promise((resolve, reject) => {
            this.sse.onopen = () => {
                this.status = "connected"
            }
            this.sse.onerror = () => {
                this.error = new Error("Failed to connect")
                this.status = "disconnected"
                reject(this.error)
            }
            this.sse.onmessage = (event) => {
                const data = JSON.parse(event.data)
                switch (data.type) {
                    case "ready":
                        this.peerId = data.peerId
                        this.error = null
                        this.status = "ready"
                        resolve(this)
                        break

                    case "join":
                        commit("playerRegistory/add", {
                            peerId: data.senderId,
                            description: null,
                        })
                        break

                    case "leave":
                        commit("playerRegistory/remove", { //
                            peerId: data.senderId,
                        })
                        break

                    case "iceCandidate":
                        commit("playerRegistory/setIceCandidate", {
                            peerId: data.senderId,
                            candidate: data.candidate,
                        })
                        break

                    case "negotiationOffer":
                        commit("playerRegistory/add", {
                            peerId: data.senderId,
                            description: data.description,
                        })
                        break

                    case "negotiationAnswer":
                        commit("playerRegistory/setRemoteDescription", {
                            peerId: data.senderId,
                            description: data.description,
                        })
                        break

                    // no default
                }
            }
        })
    }

    /**
     * It disposes this channel.
     * @returns {void}
     */
    dispose() {
        this.sse.close()
        this.peerId = null
        this.error = null
        this.status = "disconnected"
    }

    /**
     * It sends an ICE candidate to the given peer.
     *
     * @param {string} targetId - The destination peer to send.
     * @param {any} candidate - The candidate to be sent.
     * @returns {Promise<void>} The promise which becomes fulfilled if finished.
     */
    sendIceCandidate(targetId, candidate) {
        return this._sendSignal({
            type: "iceCandidate",
            targetId,
            candidate,
        })
    }

    /**
     * It sends a negotiation offer to the given peer.
     *
     * @param {string} targetId - The destination peer to send.
     * @param {any} description - The peer description to be sent.
     * @returns {Promise<void>} The promise which becomes fulfilled if finished.
     */
    sendNegotiationOffer(targetId, description) {
        return this._sendSignal({
            type: "negotiationOffer",
            targetId,
            description,
        })
    }

    /**
     * It sends a negotiation answer to the given peer.
     *
     * @param {string} targetId - The destination peer to send.
     * @param {any} description - The peer description to be sent.
     * @returns {Promise<void>} The promise which becomes fulfilled if finished.
     */
    sendNegotiationAnswer(targetId, description) {
        return this._sendSignal({
            type: "negotiationAnswer",
            targetId,
            description,
        })
    }

    /**
     * It sends a signal.
     *
     * @param {object} data - The signal data to be sent.
     * @returns {Promise<void>} The promise which becomes fulfilled if finished.
     * @private
     */
    _sendSignal(data) {
        return Ajax.request({
            method: "POST",
            path: this.url,
            password: this.peerId,
            data,
        })
    }
}
