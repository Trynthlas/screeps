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
    },

    /**
     * Run-length decode an array
     *
     * @author warinternal
     * @param {Array} [arr]
     * @return {Array}
     */
    RLD: function(arr) {
        if( !arr || !arr.length ) {
            throw new Error('RLD expects non-empty array');
        }
        let r = [];
        for( let i = 0; i < arr.length; i += 2 ) {
            let c = arr[i];
            let v = arr[i + 1];
            while( c > 0 ) {
                r.push(v);
                --c;
            }
        }
        return r;
    }


};