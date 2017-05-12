'use strict';

let defs = require('defs'),
    Task = require('Task');

class TowerRepair extends Task {
    constructor(taskType, targetId, status, prio) {
        super(taskType, targetId, status, prio);

        if( this.target && !this.target instanceof Structure ) {
            throw new TypeError('target for TowerRepair must be Structure, got', JSON.stringify(this.target));
        }
    }

    isComplete() {
        if( this.status === Task.STATUS.DONE ) {
            return true;
        }

        switch( this.target.structureType ) {
        case STRUCTURE_RAMPART:
        case STRUCTURE_WALL:
            return this.target.hits >= WALL_BUILD_MAX;
        case STRUCTURE_ROAD:
            return this.target.hits >= this.target.hitsMax * 0.75;
        default:
            return this.target.hits === this.target.hitsMax;
        }
    }

    /** @param {StructureTower} actor **/
    execute(actor) {
        if( this.isComplete() ) {
            console.log('TowerRepair task for', this.target.structureType, '(', this.target.id, ')', 'is complete.');
            return Task.STATUS.DONE;
        }

        if( actor.energy >= 10 ) {
            let ec;
            if( (ec = actor.repair(this.target)) !== OK ) {
                Game.notify('Tower ' + actor.id + ' failed to repair target ' + this.target.id + '. EC=' + ec, 1);
            }
        } else {
            // console.log("Tower",actor.id,"has insufficient energy to do task");
        }

        return Task.STATUS.TODO;
    }
}

module.exports = TowerRepair;