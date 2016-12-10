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

const EventTarget = require("event-target-shim")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const RTCPeerConnection =
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection
const PEER_CONF = Object.freeze({
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
    ],
})

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * The player.
 * This manages the connection between me and a player.
 */
module.exports = class Player extends EventTarget {
    /**
     * @param {string} peerId - The peer ID of this player.
     * @param {any} description - The peer description.
     * @param {SignalingChannel} signals - The signaling channel.
     * @param {string} myName - The name to send by the `ready` event.
     */
    constructor(peerId, description, signals, myName) {
        super()
        this.peerId = peerId
        this.signals = signals
        this.peer = new RTCPeerConnection(PEER_CONF)
        this.channel = null
        this.status = "connecting"
        this.error = null
        this.name = null
        this._setupPeer(description, myName)
    }

    /**
     * It disposes this player.
     * @returns {void}
     */
    dispose() {
        this.peer.close()
    }

    /**
     * It sends the given data to this peer.
     *
     * @param {any} data - The data to be sent.
     * @returns {void}
     */
    send(data) {
        if (this.channel) {
            this.channel.send(JSON.stringify(data))
        }
    }

    /**
     * It adds an ICE candidate to this peer.
     *
     * @param {any} candidate - The candidate to be added.
     * @returns {void}
     */
    setIceCandidate(candidate) {
        this.peer.addIceCandidate(candidate).catch(error => {
            this.error = error
            this.status = "disconnected"
        })
    }

    /**
     * It set the negotiation answer to this peer.
     *
     * @param {any} description - The peer description to be set.
     * @returns {void}
     */
    setRemoteDescription(description) {
        this.peer.setRemoteDescription(description).catch(error => {
            this.error = error
            this.status = "disconnected"
        })
    }

    /**
     * It initializes `this.peer`.
     *
     * @param {any} description - The peer description to initialize.
     * @param {string} myName - The name to send by the `ready` event.
     * @returns {void}
     * @private
     */
    _setupPeer(description, myName) {
        this.peer.onicecandidate = (event) => {
            if (event.candidate != null) {
                this.signals.sendIceCandidate(this.peerId, event.candidate)
            }
        }

        if (description != null) {
            this.peer
                .setRemoteDescription(description)
                .then(() => this.peer.createAnswer())
                .then(answer => this.peer.setLocalDescription(answer))
                .then(() => this.signals.sendNegotiationAnswer(
                    this.peerId,
                    this.peer.localDescription
                ))
                .catch(error => {
                    this.error = error
                    this.status = "disconnected"
                })
            this.channel = this.peer.createDataChannel("default")
            this._setupChannel(myName)
        }
        else {
            this.peer.onnegotiationneeded = () => {
                this.peer
                    .createOffer()
                    .then(offer => this.peer.setLocalDescription(offer))
                    .then(() => this.signals.sendNegotiationOffer(
                        this.peerId,
                        this.peer.localDescription
                    ))
                    .catch(error => {
                        this.error = error
                        this.status = "disconnected"
                    })
            }
            this.peer.ondatachannel = (event) => {
                this.channel = event.channel
                this._setupChannel(myName)
            }
        }
    }

    /**
     * It initializes `this.channel`.
     *
     * @param {string} myName - The name to send by the `ready` event.
     * @returns {void}
     * @private
     */
    _setupChannel(myName) {
        this.channel.onopen = () => {
            this.error = null
            this.status = "connected"
            this.channel.send(JSON.stringify({
                type: "ready",
                name: myName,
            }))
        }
        this.channel.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === "ready") {
                this.name = data.name
                this.status = "ready"
            }
            else {
                this.dispatchEvent(data)
            }
        }
        this.channel.onerror = (event) => {
            this.error = event
            this.status = "disconnected"
        }
    }
}
