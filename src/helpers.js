'use strict';

module.exports = {
    getRemainingAmountToHarvest: function(node) {
        if( node instanceof Source ) {
            return node.energy;
        } else if( node instanceof Mineral ) {
            return node.mineralAmount;
        }

        return undefined;
    }
};