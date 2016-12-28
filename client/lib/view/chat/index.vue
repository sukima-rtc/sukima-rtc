<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div class="chat">
        <message-area></message-area>
        <input-area></input-area>
    </div>
</template>

<script>
"use strict"

module.exports = {
    components: {
        "input-area": require("./input-area.vue"),
        "message-area": require("./message-area.vue"),
    },
}
</script>

<style scoped>
.chat {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    width: 480px;
}

.chat >:first-child {
    flex-grow: 1;
    flex-shrink: 1;
}
.chat >:last-child {
    flex-shrink: 0;
}
</style>
