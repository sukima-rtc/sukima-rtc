/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {Button, Dialog, Icon, ProgressBar, MdlUtils} = require("../common")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    mixins: [MdlUtils.mixin("table")],

    render(h) {
        const {error, rooms, status} = this.$store.roomRegistory

        return <Dialog>
            <div slot="title">
                部屋を選択してください
            </div>
            <div>
                <table ref="table" class="mdl-data-table mdl-js-data-table" style="width:100%">
                    <thead>
                        <tr>
                            <th class="mdl-data-table__cell--non-numeric">名前</th>
                            <th class="mdl-data-table__cell--non-numeric">概要</th>
                            <th style="width:50px">人数</th>
                            <th style="width:50px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            rooms.map(room =>
                                <tr key={room.id} data-roomid={room.id} onClick={this.handleClick}>
                                    <td class="mdl-data-table__cell--non-numeric">{room.name}</td>
                                    <td class="mdl-data-table__cell--non-numeric">{room.description}</td>
                                    <td>{room.players}人</td>
                                    <td><Icon kind="keyboard_arrow_right"/></td>
                                </tr>
                            )
                        }
                        <tr v-show={status === "connecting" || status === "connected"}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="4" style="text-align:center;">
                                <ProgressBar style="width:100%"/>
                                部屋の一覧を取得しています。
                            </td>
                        </tr>
                        <tr v-show={status === "ready" && rooms.length === 0}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="4" style="text-align:center;">
                                部屋はありませんでした。<br/>
                                右下のボタンから新しい部屋を作成できます。
                            </td>
                        </tr>
                        <tr v-show={status === "disconnected" && error != null}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="4">
                                <Icon kind="warning"/>エラーが発生しました。<br/>
                                > "{error}"
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div slot="actions">
                <Button primary raised>
                    <Icon kind="add_circle"/>
                    新しい部屋を作る
                </Button>
            </div>
        </Dialog>
    },

    methods: {
        handleClick(event) {
            console.log(event)
        },
    },

    mounted() {
        this.$store.connectRoomRegistory()
    },

    destroyed() {
        this.$store.disconnectRoomRegistory()
    },
}
