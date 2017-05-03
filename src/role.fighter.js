'use strict';

const defs = require('defs');

let roleFighter = {
    run: function(creep) {
        let closestEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if( closestEnemy && creep.attack(closestEnemy) === ERR_NOT_IN_RANGE ) {
            creep.moveTo(closestEnemy);
        } else if( !closestEnemy ) {
            if( creep.hits < creep.hitsMax ) {
                creep.heal(creep);
            } else {
                if( !creep.memory.remoteTarget ) {
                    creep.memory.remoteTarget = 'Kill';
                }

                creep.moveTo(Game.flags[creep.memory.remoteTarget], {reusePath: 20});
            }
        }
    }
};

module.exports = roleFighter;