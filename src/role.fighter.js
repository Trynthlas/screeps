'use strict';

const defs = require('defs');

let roleFighter = {
    run: function(creep) {
        let closestEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if( closestEnemy && creep.attack(closestEnemy) === ERR_NOT_IN_RANGE ) {
            creep.moveTo(closestEnemy);
        }
    }
};

module.exports = roleFighter;