/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals localStorage */

const {Button, Dialog, Icon, ProgressBar, TextField} = require("../common")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "SukimaLoginRoomDialog",

    data() {
        return {
            busy: false,
            password: "",
            playerName: "",
        }
    },

    computed: {
        roomId() {
            return this.$route.params.id
        },

        room() {
            const {rooms} = this.$store.state.roomRegistory
            return rooms.find(room => room.id === this.roomId) || {}
        },

        buttonDisabled() {
            return !this.playerName
        },

        playerNameKey() {
            return `${this.roomId}/playerName`
        },
    },

    render(h) {
        return <Dialog>
            <div slot="title">
                {this.room.name || "(部屋情報を取得中...)"}
            </div>
            <div>{this.room.description}</div>
            <hr/>
            <div style="text-align: center">
                <TextField
                    autofocus={!this.playerName}
                    disabled={this.busy}
                    float
                    label="プレイヤー名"
                    maxlength={64}
                    required
                    tabIndex={1}
                    value={this.playerName}
                    onInput={this.handlePlayerNameInput}
                /><br/>
                <TextField
                    autofocus={Boolean(this.playerName)}
                    disabled={this.busy}
                    float
                    label="入室パスワード"
                    maxlength={64}
                    password
                    tabIndex={2}
                    value={this.password}
                    onInput={this.handlePasswordInput}
                /><br/>
            </div>
            <div slot="actions">
                <ProgressBar v-show={this.busy} indeterminate/>
                <Button
                    disabled={this.busy}
                    tabIndex={4}
                    onClick={this.handleShowList}
                >
                    <Icon kind="list"/>
                    部屋一覧
                </Button>
                <Button
                    disabled={this.buttonDisabled || this.busy}
                    primary
                    raised
                    tabIndex={3}
                    onClick={this.handleLogin}
                >
                    <Icon kind="directions_walk"/>
                    入室する
                </Button>
            </div>
        </Dialog>
    },

    methods: {
        async handleLogin() {
            if (this.buttonDisabled || this.busy) {
                return
            }

            this.busy = true
            try {
                const roomId = this.roomId
                await this.$store.dispatch("joinRoom", {
                    roomId,
                    playerName: this.playerName,
                    password: this.password,
                })

                localStorage.setItem(this.playerNameKey, this.playerName)
                this.$router.replace(".")
            }
            catch (_err) {
                this.$showError("入室に失敗しました。")
            }
            finally {
                this.busy = false
            }
        },

        handleShowList() {
            this.$router.push("..")
        },

        handlePlayerNameInput(value) {
            this.playerName = value
        },

        handlePasswordInput(value) {
            this.password = value
        },
    },

    mounted() {
        this.playerName = localStorage.getItem(this.playerNameKey) || ""
        this.$store.dispatch("connectRoomRegistory")
    },
}
