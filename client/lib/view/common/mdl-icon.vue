<!--
@author Toru Nagashima
@copyright 2016 Toru Nagashima. All rights reserved.
See LICENSE file in root directory for full license.
-->

<template>
    <i class="material-icons">{{kind}}</i>
</template>

<script>
"use strict"

module.exports = {
    functional: true,
    props: { //
        kind: {type: String, required: true},
    },
}
</script>
