'use strict';

module.exports = {

    ROOM_UPDATE_RATE:        100,
    ROOM_UPDATE_REPAIR_RATE: 25,

    WALL_BUILD_MAX: 200000,
    WALL_BUILD_FIX: 150000,

    DIRECTIONS: {
        NORTH:     {x: 0, y: -1},
        NORTHEAST: {x: -1, y: -1},
        EAST:      {x: 1, y: 0},
        SOUTHEAST: {x: 1, y: 1},
        SOUTH:     {x: 0, y: 1},
        SOUTHWEST: {x: -1, y: 1},
        WEST:      {x: -1, y: 0},
        NORTHWEST: {x: -1, y: -1}
    },

    ACTORS: {
        CREEP: 'creep',
        TOWER: 'tower',
        SPAWN: 'spawn'
    },

    TASKS: {
        ATTACK: 'attack',
        HEAL:   'heal',
        REPAIR: 'repair',
        IDLE:   'idle'
    }

};