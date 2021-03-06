'use strict';

global.MEMORY_CLEANUP_INTERVAL = 10000;
global.ROOM_UPDATE_INTERVAL = 1000;
global.ROOM_FIND_REPAIR_INTERVAL = 50;

global.WALL_BUILD_MAX = 400000;
global.WALL_BUILD_FIX = 350000;

global.DIRECTIONS = {
    NORTH:     { x: 0, y: -1 },
    NORTHEAST: { x: -1, y: -1 },
    EAST:      { x: 1, y: 0 },
    SOUTHEAST: { x: 1, y: 1 },
    SOUTH:     { x: 0, y: 1 },
    SOUTHWEST: { x: -1, y: 1 },
    WEST:      { x: -1, y: 0 },
    NORTHWEST: { x: -1, y: -1 }
};

global.TASKS = {
    ATTACK:  'attack',
    HEAL:    'heal',
    REPAIR:  'repair',
};

global.ROLES = {
    FLEX_WORKER:      'flex worker',
    HARVESTER_MOBILE: 'mobile harvester',
    HARVESTER_STATIC: 'static harvester',
    HAULER:           'hauler',
    UPGRADER:         'upgrader',
    FIGHTER:          'fighter',
    RANGER:           'ranger',
    HEALER:           'healer',
    FLEX_COMBAT:      'flex fighter',
    SCOUT:            'scout'
};

global.PRIORITY = {
    IMMEDIATE: 1,
    URGENT:    2,
    HIGH:      3,
    NORMAL:    4,
    LOW:       5
};

global.STD_MOVETO_OPTS = {
    reusePath:    10,
    ignoreCreeps: true,
    maxOps:       200
};

module.exports = {

    ACTORS: {
        CREEP: 'creep',
        TOWER: 'tower',
        SPAWN: 'spawn'
    },

    HEAL_PART_THRESHOLD:   3,
    ATTACK_PART_THRESHOLD: 3
};