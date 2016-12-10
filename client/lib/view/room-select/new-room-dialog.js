/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {Button, Dialog, Icon, ProgressBar, TextField} = require("../common")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "SukimaNewRoomDialog",

    data() {
        return {
            name: "",
            description: "",
            password: "",
            playerName: "",
            busy: false,
        }
    },

    computed: {
        buttonDisabled() {
            return !(this.name && this.playerName)
        },
    },

    render(h) {
        return <Dialog>
            <div slot="title">
                新しい部屋
            </div>
            <div style="text-align: center">
                <TextField
                    autofocus
                    disabled={this.busy}
                    float
                    label="部屋名"
                    maxlength={64}
                    required
                    tabIndex={1}
                    value={this.name}
                    onInput={this.handleNameInput}
                /><br/>
                <TextField
                    disabled={this.busy}
                    float
                    label="概要"
                    maxlength={256}
                    tabIndex={2}
                    value={this.description}
                    onInput={this.handleDescriptionInput}
                /><br/>
                <TextField
                    disabled={this.busy}
                    float
                    label="入室パスワード"
                    maxlength={64}
                    password
                    tabIndex={3}
                    value={this.password}
                    onInput={this.handlePasswordInput}
                /><br/>
                <TextField
                    disabled={this.busy}
                    float
                    label="プレイヤー名"
                    maxlength={64}
                    required
                    tabIndex={4}
                    value={this.playerName}
                    onInput={this.handlePlayerNameInput}
                /><br/>
            </div>
            <div slot="actions">
                <ProgressBar v-show={this.busy} indeterminate/>
                <Button
                    disabled={this.busy}
                    tabIndex={6}
                    onClick={this.handleShowList}
                >
                    <Icon kind="list"/>
                    部屋一覧
                </Button>
                <Button
                    disabled={this.buttonDisabled || this.busy}
                    primary
                    raised
                    tabIndex={5}
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
                const room = await this.$store.dispatch("createRoom", {
                    name: this.name,
                    description: this.description,
                    password: this.password,
                })
                await this.$store.dispatch("joinRoom", {
                    roomId: room.id,
                    playerName: this.playerName,
                    password: this.password,
                })
                this.$router.replace(`${room.id}`)
            }
            catch (_err) {
                this.$showError("入室に失敗しました。")
            }
            finally {
                this.busy = false
            }
        },

        handleShowList() {
            this.$router.push(".")
        },

        handleNameInput(value) {
            this.name = value
        },

        handleDescriptionInput(value) {
            this.description = value
        },

        handlePasswordInput(value) {
            this.password = value
        },

        handlePlayerNameInput(value) {
            this.playerName = value
        },
    },
}
