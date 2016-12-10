/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    name: "Icon",
    functional: true,

    props: {
        kind: {
            type: String,
            required: true,
        },
    },

    render(h, context) {
        return <i class="material-icons">{context.props.kind}</i>
    },
}
