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
            let nextToFill = roomManagerPool.getManager(creep.room.name).getTargetContainerForResource(RESOURCE_ENERGY);
            if( nextToFill ) {
                if( nextToFill.length > 1 ) {
                    nextToFill = creep.pos.findClosestByRange(nextToFill);
                } else {
                    nextToFill = nextToFill[0];
                }

                if( creep.transfer(nextToFill, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(nextToFill, STD_MOVETO_OPTS);
                }
            }
            // else no target
        } else {
            creep.drop(RESOURCE_ENERGY);
        }

        super.doTick(creep);
    }
}

module.exports = DepositResource;