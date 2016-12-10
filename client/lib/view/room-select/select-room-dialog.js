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
    name: "SukimaSelectRoomDialog",
    mixins: [MdlUtils.mixin("table")],

    render(h) {
        const {
            error,
            rooms,
            status,
            knownRoomIds,
        } = this.$store.state.roomRegistory

        return <Dialog>
            <div>
                <table ref="table" class="mdl-data-table mdl-js-data-table sukima-select-room-dialog__table">
                    <thead>
                        <tr class="sukima-select-room-dialog__header">
                            <th class="mdl-data-table__cell--non-numeric">名前</th>
                            <th class="mdl-data-table__cell--non-numeric">概要</th>
                            <th>人数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            rooms.map(room =>
                                <tr key={room.id} data-room-id={room.id} onClick={this.handleSelectRoom} class="sukima-select-room-dialog__row">
                                    <td class="mdl-data-table__cell--non-numeric" title={room.name}>{knownRoomIds.has(room.id) ? "🌟" : null}{room.name}</td>
                                    <td class="mdl-data-table__cell--non-numeric" title={room.description}>{room.description}</td>
                                    <td>{room.players}人</td>
                                </tr>
                            )
                        }
                        <tr v-show={status === "connecting" || status === "connected"}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="3" style="text-align:center;">
                                <ProgressBar indeterminate/>
                                部屋の一覧を取得しています。
                            </td>
                        </tr>
                        <tr v-show={status === "ready" && rooms.length === 0}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="3" style="text-align:center;">
                                部屋はありませんでした。
                            </td>
                        </tr>
                        <tr v-show={status === "disconnected" && error != null}>
                            <td class="mdl-data-table__cell--non-numeric" colspan="3">
                                <Icon kind="warning"/>エラーが発生しました。<br/>
                                > "{error}"
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div slot="actions">
                <Button primary raised onClick={this.handleNewRoom}>
                    <Icon kind="add_circle"/>
                    新しい部屋を作る
                </Button>
            </div>
        </Dialog>
    },

    methods: {
        handleNewRoom() {
            this.$router.push(`${this.$route.path}/new`)
        },

        handleSelectRoom(event) {
            let element = event.target
            while (element != null && element.tagName !== "TR") {
                element = element.parentNode
            }

            const roomId = element.dataset.roomId
            this.$router.push(`${this.$route.path}/${roomId}`)
        },
    },

    mounted() {
        this.$store.dispatch("connectRoomRegistory")
    },
}
