'use strict';

const defs            = require('defs'),
      State           = require('State'),
      Task            = require('Task'),
      roomManagerPool = require('RoomManager');

class EndOfLife extends State {
    constructor() {
        super();
    }

    static onEnter(creep) {
        creep.drop(RESOURCE_ENERGY);
        try {
            roomManagerPool.getManager(creep.memory.homeRoom).addCreepToSpawnQ(creep.memory.role, PRIORITY.NORMAL);
        } catch( e ) {
            console.log(e);
        }
    }

    static onExit(creep) {

    }

    static doTick(creep) {
        let room = creep.memory.homeRoom ? Game.rooms[creep.memory.homeRoom] : undefined;
        if( room && room.spawns && room.spawns[0].recycleCreep(creep) === ERR_NOT_IN_RANGE ) {
            creep.moveTo(room.spawns[0], STD_MOVETO_OPTS);
        }
    }
}


module.exports = EndOfLife;