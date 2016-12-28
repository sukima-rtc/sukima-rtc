<!--
@author Toru Nagashima <https://github.com/mysticatea>
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <mdl-dialog>
        <div slot="title">
            {{room.name || "(部屋情報を取得中...)"}}
        </div>
        <div>{{room.description}}</div>
        <hr>
        <div style="text-align:center">
            <mdl-input
                float
                required
                label="プレイヤー名"
                maxlength="64"
                tabIndex="1"
                :autofocus="!playerName"
                :disabled="busy"
                :value="playerName"
                @input="handlePlayerNameInput"
            ></mdl-input><br>
            <mdl-input
                float
                password
                label="入室パスワード"
                maxlength="64"
                tabIndex="2"
                :autofocus="!!playerName"
                :disabled="busy"
                :value="password"
                @input="handlePasswordInput"
            ></mdl-input><br>
        </div>
        <div slot="actions">
            <mdl-progress v-show="busy" indeterminate></mdl-progress>
            <mdl-button
                tabIndex="4"
                :disabled="busy"
                @click="handleShowList"
            >
                <mdl-icon kind="list"></mdl-icon>
                部屋一覧
            </mdl-button>
            <mdl-button
                primary
                raised
                tabIndex="3"
                :disabled="buttonDisabled || busy"
                @click="handleLogin"
            >
                <mdl-icon kind="directions_walk"></mdl-icon>
                入室する
            </mdl-button>
        </div>
    </mdl-dialog>
</template>

<script>
"use strict"

/*globals localStorage */

module.exports = {
    components: {
        "mdl-button": require("../common/mdl-button.vue"),
        "mdl-dialog": require("../common/mdl-dialog.vue"),
        "mdl-icon": require("../common/mdl-icon.vue"),
        "mdl-input": require("../common/mdl-input.vue"),
        "mdl-progress": require("../common/mdl-progress.vue"),
    },

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
</script>
