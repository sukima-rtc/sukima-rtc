<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <mdl-dialog>
        <div>
            <table ref="table" class="mdl-data-table mdl-js-data-table">
                <thead>
                    <tr class="header">
                        <th class="mdl-data-table__cell--non-numeric">名前</th>
                        <th class="mdl-data-table__cell--non-numeric">概要</th>
                        <th>人数</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="room in rooms" :key="room.id" :data-room-id="room.id" @click="handleSelectRoom" class="row">
                        <td class="mdl-data-table__cell--non-numeric" :title="room.name">
                            {{knownRoomIds.has(room.id) ? `🌟 ${room.name}` : room.name}}
                        </td>
                        <td class="mdl-data-table__cell--non-numeric" :title="room.description">
                            {{room.description}}
                        </td>
                        <td>{room.players}人</td>
                    </tr>
                    <tr v-if="isLoading">
                        <td class="mdl-data-table__cell--non-numeric loading-row" colspan="3">
                            <mdl-progress indeterminate></mdl-progress>
                            部屋の一覧を取得しています。
                        </td>
                    </tr>
                    <tr v-if="isEmpty">
                        <td class="mdl-data-table__cell--non-numeric empty-row" colspan="3">
                            部屋はありませんでした。
                        </td>
                    </tr>
                    <tr v-if="isError">
                        <td class="mdl-data-table__cell--non-numeric" colspan="3">
                            <mdl-icon kind="warning"></mdl-icon>
                            エラーが発生しました。
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div slot="actions">
            <mdl-button primary raised @click="handleNewRoom">
                <mdl-icon kind="add_circle"></mdl-icon>
                新しい部屋を作る
            </mdl-button>
        </div>
    </mdl-dialog>
</template>

<script>
"use strict"

const MdlUtils = require("../common/mdl-utils")

module.exports = {
    components: {
        "mdl-button": require("../common/mdl-button.vue"),
        "mdl-dialog": require("../common/mdl-dialog.vue"),
        "mdl-icon": require("../common/mdl-icon.vue"),
        "mdl-progress": require("../common/mdl-progress.vue"),
    },
    mixins: [MdlUtils.mixin("table")],

    computed: {
        error() {
            return this.$store.state.roomRegistory.error
        },
        rooms() {
            return this.$store.state.roomRegistory.rooms
        },
        status() {
            return this.$store.state.roomRegistory.status
        },
        knownRoomIds() {
            return this.$store.state.roomRegistory.knownRoomIds
        },
        isLoading() {
            return this.status === "connecting" || this.status === "connected"
        },
        isEmpty() {
            return this.status === "ready" && this.rooms.length === 0
        },
        isError() {
            return this.status === "disconnected" && this.error != null
        },
    },

    methods: {
        handleNewRoom() {
            this.moveTo("new")
        },

        handleSelectRoom(event) {
            let element = event.target
            while (element != null && element.tagName !== "TR") {
                element = element.parentNode
            }

            this.moveTo(element.dataset.roomId)
        },

        moveTo(roomId) {
            this.$router.push(`${this.$route.path}/${roomId}`)
        },
    },

    mounted() {
        this.$store.dispatch("connectRoomRegistory")
    },
}
</script>

<style scoped>
table {
    width: 100%;
    table-layout: fixed;
}

.header >th:nth-child(1) {
    width: 250px;
}
.header >th:nth-child(3) {
    width: 75px;
}

.row {
    cursor: pointer;
}

.row >td {
    overflow: hidden;
    text-overflow: ellipsis;
}

.loading-row,
.empty-row {
    text-align: center;
}
</style>
