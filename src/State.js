'use strict';


class State {
    constructor() {
    }

    static onEnter(creep) {
        creep.say('Switching to ' + this.constructor.name);
    }

    static onExit(creep) {
        throw new TypeError('Must implement method');
    }

    static doTick(creep) {
        if( creep.getActiveBodyparts(CARRY) ) {
            creep.pickupNearbyEnergy();
        }
    }
}

module.exports = State;