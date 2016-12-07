/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals componentHandler, window */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

let shouldControl = false

// MDL would upgrade elements on the load event.
// So it should upgrade/downgrade elements after the load event.
window.addEventListener("load", () => {
    shouldControl = (typeof componentHandler !== "undefined")
})

/**
 * The mixin for `$el`.
 *
 * @type {{mounted: function():void, beforeDestroy: function():void}}
 */
const MIXIN_$EL = Object.freeze({
    mounted() {
        if (shouldControl) {
            componentHandler.upgradeElement(this.$el)
        }
    },
    beforeDestroy() {
        if (shouldControl) {
            componentHandler.downgradeElements(this.$el)
        }
    },
})

/**
 * It creates the mixin for the given `$refs`.
 *
 * @param {string} key - The key of the target element.
 * @returns {{mounted: function():void, beforeDestroy: function():void}} The created mixin.
 */
function createSingleRefMixin(key) {
    return {
        mounted() {
            if (shouldControl) {
                componentHandler.upgradeElement(this.$refs[key])
            }
        },
        beforeDestroy() {
            if (shouldControl) {
                componentHandler.downgradeElements(this.$refs[key])
            }
        },
    }
}

/**
 * It creates the mixin for the given `$refs`.
 *
 * @param {string[]} keys - The keys of the target elements.
 * @returns {{mounted: function():void, beforeDestroy: function():void}} The created mixin.
 */
function createMultipleRefMixin(keys) {
    return {
        mounted() {
            if (shouldControl) {
                componentHandler.upgradeElements(
                    keys.map(key => this.$refs[key])
                )
            }
        },
        beforeDestroy() {
            if (shouldControl) {
                componentHandler.downgradeElements(
                    keys.map(key => this.$refs[key])
                )
            }
        },
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = {
    upgrade(element) {
        if (shouldControl) {
            componentHandler.upgradeElement(element)
        }
    },

    downgrade(element) {
        if (shouldControl) {
            componentHandler.downgradeElements(element)
        }
    },

    mixin(...refs) {
        switch (refs.length) {
            case 0: return MIXIN_$EL
            case 1: return createSingleRefMixin(refs[0])
            default: return createMultipleRefMixin(refs)
        }
    },
}
