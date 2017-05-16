'use strict';

const State           = require('State'),
      roomManagerPool = require('RoomManager');

class DepositResource extends State {
    constructor() {
        super();
    }

    static onEnter(creep) {
    }

    static onExit(creep) {
    }

    static doTick(creep) {
        let container = creep.memory.targetContainer ? Game.getObjectById(creep.memory.targetContainer) : undefined;
        if( container ) {
            if( creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                creep.moveTo(container, STD_MOVETO_OPTS);
            }
        } else if( creep.memory.shouldHaul ) {
            let tgt = roomManagerPool.getManager(creep.room.name).wut();
            if( creep.transfer(tgt, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                creep.moveTo(tgt, STD_MOVETO_OPTS);
            }
        } else {
            creep.drop(RESOURCE_ENERGY);
        }

        super.doTick(creep);
    }
}

module.exports = DepositResource;