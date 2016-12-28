<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <div :class="cssClasses" style="width:100%"></div>
</template>

<script>
"use strict"

const MdlUtils = require("./mdl-utils")

module.exports = {
    mixins: [MdlUtils.mixin()],
    props: { //
        indeterminate: {type: Boolean, default: false},
    },

    computed: {
        cssClasses() {
            return {
                "mdl-progress": true,
                "mdl-js-progress": true,
                "mdl-progress__indeterminate": this.indeterminate,
            }
        },
    },
}
</script>
