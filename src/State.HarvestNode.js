'use strict';

const State   = require('State'),
      helpers = require('helpers');

class HarvestNode extends State {
    constructor() {
        super();
    }

    static onEnter(creep) {

    }

    static onExit(creep) {

    }

    static doTick(creep) {
        let node = Game.getObjectById(creep.memory.target);

        if( !creep.pos.isNearTo(node) ) {
            //container ? creep.moveTo(container, STD_MOVETO_OPTS) : creep.moveTo(node, STD_MOVETO_OPTS);
            creep.moveTo(node, STD_MOVETO_OPTS);
        } else {
            if( helpers.getRemainingAmountToHarvest(node) ) {
                creep.harvest(node);
            } else {
                let container = creep.memory.targetContainer ? Game.getObjectById(creep.memory.targetContainer) : undefined;
                creep.doLocalRepairs(container);
            }
        }

        super.doTick(creep);
    }
}


module.exports = HarvestNode;