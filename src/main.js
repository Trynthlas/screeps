'use strict';

const defs = require('defs');
const memory = require('memory');
const roleHarvester = require('role.harvester');
const rolePorter = require('role.porter');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('role.builder');
const roleFighter = require('role.fighter');

const Tower = require('Tower');
const RoomManager = require('RoomManager');

const profiler = require('screeps-profiler');

profiler.enable();

module.exports.loop = function() {
    profiler.wrap(function() {

        if( Game.time % MEMORY_CLEANUP_INTERVAL === 0 ) {
            memory.free();
        }

        let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
        let porters = _.filter(Game.creeps, (creep) => creep.memory.role === 'porter');
        let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
        let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');

        if( harvesters.length < 2 ) {
            let newName = Game.spawns['Spawn1'].createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, {role: 'harvester'});
            console.log('Spawning new harvester: ' + newName);
        }
        if( porters.length < 2 ) {
            let newName = Game.spawns['Spawn1'].createCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE], undefined, {role: 'porter'});
            console.log('Spawning new porter: ' + newName);
        }
        if( upgraders.length < 3 ) {
            let newName = Game.spawns['Spawn1'].createCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], undefined,
                {role: 'upgrader'});
            console.log('Spawning new upgrader: ' + newName);
        }
        if( builders.length < 2 ) {
            let newName = Game.spawns['Spawn1'].createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, {role: 'builder'});
            console.log('Spawning new builder: ' + newName);
        }

        if( Game.spawns['Spawn1'].spawning ) {
            let spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                {align: 'left', opacity: 0.8});
        }

        for( let name in Game.creeps ) {
            let creep = Game.creeps[name];
            if( creep.memory.role === 'harvester' ) {
                roleHarvester.run(creep, porters.length > 0);
            }
            if( creep.memory.role === 'porter' ) {
                rolePorter.run(creep);
            }
            if( creep.memory.role === 'upgrader' ) {
                roleUpgrader.run(creep);
            }
            if( creep.memory.role === 'builder' ) {
                roleBuilder.run(creep);
            }
            if( creep.memory.role === 'fighter' ) {
                roleFighter.run(creep);
            }
        }

        for( const name in Game.rooms ) {
            let room = new RoomManager(Game.rooms[name]);
            room.runRoom();
        }
    });
};