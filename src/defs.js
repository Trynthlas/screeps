/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('defs');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

    ROOM_UPDATE_RATE: 1,

    WALL_BUILD_MAX: 150000,
    WALL_BUILD_FIX: 102000,

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