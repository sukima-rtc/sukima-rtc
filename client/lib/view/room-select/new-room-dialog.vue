<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <mdl-dialog>
        <div slot="title">
            新しい部屋
        </div>
        <div style="text-align:center">
            <mdl-input
                autofocus
                float
                required
                label="部屋名"
                maxlength="64"
                tabIndex="1"
                :disabled="busy"
                :value="name"
                @input="handleNameInput"
            ></mdl-input><br>
            <mdl-input
                float
                label="概要"
                maxlength="256"
                tabIndex="2"
                :disabled="busy"
                :value="description"
                @input="handleDescriptionInput"
            ></mdl-input><br>
            <mdl-input
                float
                password
                label="入室パスワード"
                maxlength="64"
                tabIndex="3"
                :disabled="busy"
                :value="password"
                @input="handlePasswordInput"
            ></mdl-input><br>
            <mdl-input
                float
                required
                label="プレイヤー名"
                maxlength="64"
                tabIndex="4"
                :disabled="busy"
                :value="playerName"
                @input="handlePlayerNameInput"
            ></mdl-input><br>
        </div>
        <div slot="actions">
            <mdl-progress v-show="busy" indeterminate></mdl-progress>
            <mdl-button tabIndex="6" :disabled="busy" @click="handleShowList">
                <mdl-icon kind="list"></mdl-icon>
                部屋一覧
            </mdl-button>
            <mdl-button primary raised tabIndex="5" :disabled="buttonDisabled" @click="handleLogin">
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
            name: "",
            description: "",
            password: "",
            playerName: "",
            busy: false,
        }
    },

    computed: {
        buttonDisabled() {
            return !(this.name && this.playerName) || this.busy
        },
    },

    methods: {
        async handleLogin() {
            if (this.buttonDisabled) {
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

                localStorage.setItem(`${room.id}/playerName`, this.playerName)
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
</script>
