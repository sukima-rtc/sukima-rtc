/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Vue = require("vue")
const RoomRegistory = require("../model/room-registory")

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

Vue.component("sukima-entrance-dialog", {
    style: `
        .sukima-entrance-dialog {
        }
        .component-fade-enter-active, .component-fade-leave-active {
            transition: opacity .3s ease;
        }
        .component-fade-enter, .component-fade-leave-active {
            opacity: 0;
        }
    `,
    template: `
        <div class="sukima-entrance-dialog mdl-dialog">
            <div class="mdl-dialog__title">
                部屋を選択してください
            </div>
            <div class="mdl-dialog__content">
                <transition name="component-fade">
                    <component :is="view" :status="status" :rooms="rooms" :error="error">
                    </component>
                </transition>
            </div>
            <div class="mdl-dialog__actions">
                <button type="button" @click="openNewRoomDialog" class="mdl-button mdl-js-button mdl-button--primary mdl-button--raised mdl-js-ripple-effect">
                    <i class="material-icons">add_circle</i>
                    新しい部屋を作る
                </button>
            </div>
        </div>
    `,

    props: ["value"],

    data() {
        return {
            view: "room-list",
            status: "loading",
            rooms: [],
            error: null,
            loginName: null,
            loginPassword: null,
        }
    },

    created() {
        this.registory = RoomRegistory.connect()
        this.registory.then(
            (registory) => {
                this.status = "ready"
                this.rooms = registory.rooms
            },
            (err) => {
                this.status = "error"
                this.error = `Failed to fetch rooms: ${err.status}.`
                this.registory = null
            }
        )
    },

    destroyed() {
        if (this.registory != null) {
            this.registory.then(registory => {
                registory.disconnect()
                this.registory = null
            })
        }
    },

    methods: {
        openNewRoomDialog() {
            this.view = "new-room"
        },
    },

    components: {
        "room-list": {
            template: `
                <table class="mdl-data-table mdl-js-data-table" style="width:100%">
                    <thead>
                        <tr>
                            <th class="mdl-data-table__cell--non-numeric">名前</th>
                            <th class="mdl-data-table__cell--non-numeric">概要</th>
                            <th style="width:50px">人数</th>
                            <th style="width:50px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="room in rooms" :key="room.id">
                            <td class="mdl-data-table__cell--non-numeric">{{room.name}}</td>
                            <td class="mdl-data-table__cell--non-numeric">{{room.description}}</td>
                            <td>{{room.players}}人</td>
                            <td><i class="material-icons">keyboard_arrow_right</i></td>
                        </tr>
                        <tr v-if="status === 'loading'">
                            <td class="mdl-data-table__cell--non-numeric" colspan="4" style="text-align:center;">
                                <div class="mdl-progress mdl-js-progress mdl-progress__indeterminate" style="width:100%"></div>
                                部屋の一覧を取得しています。
                            </td>
                        </tr>
                        <tr v-if="status === 'ready' && rooms.length === 0">
                            <td class="mdl-data-table__cell--non-numeric" colspan="4" style="text-align:center;">
                                部屋はありませんでした。<br>
                                右下のボタンから新しい部屋を作成できます。
                            </td>
                        </tr>
                        <tr v-if="status === 'error'">
                            <td class="mdl-data-table__cell--non-numeric" colspan="4">
                                <i class="material-icons">warning</i>
                                エラーが発生しました。<br>
                                > "{{error}}"
                            </td>
                        </tr>
                    </tbody>
                </table>
            `,

            props: ["status", "rooms", "error"],
        },

        "new-room": {
            template: `
                <form action="#">
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input class="mdl-textfield__input" type="text" id="newRoomName" v-model="name">
                        <label class="mdl-textfield__label" for="newRoomName">名前</label>
                    </div>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input class="mdl-textfield__input" type="text" id="newRoomDescription" v-model="description">
                        <label class="mdl-textfield__label" for="newRoomDescription">概要</label>
                    </div>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input class="mdl-textfield__input" type="password" id="newRoomPassword" v-model="password">
                        <label class="mdl-textfield__label" for="newRoomPassword">パスワード</label>
                    </div>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                        <input class="mdl-textfield__input" type="text" id="newRoomLoginUser" v-model="loginUser">
                        <label class="mdl-textfield__label" for="newRoomLoginUser">あなたのログイン名</label>
                    </div>
                </form>
            `,

            props: ["status", "rooms", "error"],
            data() {
                return {
                    name: "",
                    description: "",
                    password: "",
                    loginUser: "",
                }
            },
        },
    },
})
