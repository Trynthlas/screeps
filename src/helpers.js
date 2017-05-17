'use strict';

module.exports = {
    getRemainingAmountToHarvest: function(node) {
        if( node instanceof Source ) {
            return node.energy;
        } else if( node instanceof Mineral ) {
            return node.mineralAmount;
        }

        return undefined;
    },

    /**
     * Adds an object to the provided array (queue) and positions it using the priority property
     *
     * @param obj {object}
     * @param arr {Array}
     * @param prioProp {string}
     */
    insertToPriorityQueue: function(obj, arr, prioProp) {
        arr.push(obj);
        arr.sort((a, b) => {
            if( a[prioProp] > b[prioProp] ) {
                return 1;
            }
            if( a[prioProp] < b[prioProp] ) {
                return -1;
            }
            return 0;
        });
    }
};