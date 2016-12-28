<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div class="mdl-snackbar mdl-js-snackbar">
        <div class="mdl-snackbar__text"></div>
        <button class="mdl-snackbar__action" type="button"></button>
    </div>
</template>

<script>
"use strict"

const MdlUtils = require("./mdl-utils")

module.exports = {
    mixins: [MdlUtils.mixin()],

    methods: {
        show(message) {
            this.$el.MaterialSnackbar.showSnackbar({
                message,
                timeout: 4000,
            })
        },
    },
}
</script>
