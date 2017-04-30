'use strict';

let defs = require('defs'),
    Task = require('Task');

class TowerAttack extends Task {
    constructor(taskType, targetId, status, prio) {
        super(taskType, targetId, status, prio);

        if( this.target && !this.target instanceof Creep ) {
            throw new TypeError('target for TowerAttack must be Creep, got', JSON.stringify(this.target));
        }
    }

    isComplete() {
        return this.status === Task.STATUS.DONE || this.target.hits === 0;
    }

    /** @param {StructureTower} actor **/
    execute(actor) {
        if( this.isComplete() ) {
            console.log('TowerAttack task for', this.target.structureType, '(', this.target.id, ')', 'is complete.');
            return Task.STATUS.DONE;
        }

        if( actor.energy >= 10 ) {
            let ec;
            if( (ec = actor.attack(this.target)) !== OK ) {
                Game.notify('Tower ' + actor.id + ' failed to attack target ' + this.target.id + '. EC=' + ec, 1);
            }
        } else {
            // console.log("Tower",actor.id,"has insufficient energy to do task");
        }

        return Task.STATUS.TODO;
    }
}

module.exports = TowerAttack;