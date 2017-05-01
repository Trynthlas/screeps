'use strict';

const defs  = require('defs'),
      Task  = require('Task'),
      Tower = require('Tower');

/**
 * Manages an individual Room
 */
class RoomManager {
    constructor(room) {
        if( !room instanceof RoomManager.expectedClass ) {
            throw new TypeError('Class RoomManager was passed a non Room instance');
        }

        this.me = room;

        if( _.isUndefined(this.me.memory.info) ) {
            this.me.memory.info = RoomManager.getRoomInfo(this.me);
        }
        if( _.isUndefined(this.me.memory.taskList) ) {
            this.me.memory.taskList = [];
        }
        if( _.isUndefined(this.me.memory.towers) ) {
            this.me.memory.towers = [];
        }

        this.towers = this.me.memory.towers;
        this.taskList = _.clone(this.me.memory.taskList);
    }

    static get expectedClass() {
        return Room;
    }

    runRoom() {
        if( Game.time % defs.ROOM_UPDATE_RATE === 0 ) {
            this.updateRoom();
        }

        this.updateTasks();

        if( this.runTowers() !== OK ) {
            this.updateTowers();
            this.runTowers();
        }
    }

    runTowers() {
        // console.log('runTowers on',JSON.stringify(this.towers));
        for( const id of this.towers ) {
            let tower;
            try {
                tower = new Tower(Game.getObjectById(id));
                tower.doNextTask();
            } catch( ex ) {
                if( ex instanceof TypeError ) {
                    console.log('Error while running towers!', ex);
                    return ERR_INVALID_TARGET;
                } else {
                    throw ex;
                }
            }
        }

        return OK;
    }

    pruneTasks() {
        let len = this.taskList.length;
        this.taskList = _.filter(this.taskList, 'status', Task.STATUS.TODO);
        if( this.taskList.length !== len ) {
            this.me.memory.taskList = this.taskList;
        }
    }

    updateTasks() {
        let foundNewTasks;

        this.pruneTasks();
        foundNewTasks = this.findHostiles();

        if( Game.time % defs.ROOM_UPDATE_REPAIR_RATE === 0 || !this.taskList.find(t => {
                return t.taskType === defs.TASKS.REPAIR;
            }) ) {
            foundNewTasks = this.findRepairTasks();
        }

        // Write to memory. Avoid if there's nothing new.
        if( foundNewTasks ) {
            this.me.memory.taskList = this.taskList = _.sortBy(this.taskList, 'prio');
        }
    }

    /**
     * Updates various parts of the room in memory.
     * Do expensive operations here. Also for things that don't need to run often, like updating structure refs
     */
    updateRoom() {
        this.updateTowers();

        // purge tasks
        this.taskList = [];
    }

    /**
     * Scans the room for our towers and stores them in the room's memory.
     */
    updateTowers() {
        let towers = this.me.find(FIND_MY_STRUCTURES, {
            filter: (s) => {
                return s.structureType === STRUCTURE_TOWER;
            }
        });

        this.towers.length = 0;

        for( const t of towers ) {
            this.towers.push(t.id);
        }
    }

    addToTaskList(t) {
        let foundNewTasks = false;
        if( !_.some(this.taskList, t) ) {
            console.log('Adding task', JSON.stringify(t, 1), 'to taskList', JSON.stringify(this.taskList, 1));
            this.taskList.push(t);
            foundNewTasks = true;
        }

        return foundNewTasks;
    }

    findHostiles() {
        let foundNewTasks = false,
            hostiles      = this.me.find(FIND_HOSTILE_CREEPS);

        if( hostiles.length ) {
            // First partition = hostile fighters
            // Second partition = other hostiles
            let enemies = _.partition(hostiles, (c) => {
                console.log('Looking at hostile creep', JSON.stringify(c));
                return c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK) || c.getActiveBodyparts(HEAL);
            });

            console.log('Enemy fighters:', enemies[0].length);
            console.log('Other enemy creeps:', enemies[1].length);

            enemies[0].forEach(enemy => {
                foundNewTasks = foundNewTasks || this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.IMMEDIATE));
            });
            enemies[1].forEach(enemy => {
                foundNewTasks = foundNewTasks || this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.URGENT));
            });
        }

        return foundNewTasks;
    }

    findRepairTasks() {
        let repairTargets = this.me.find(FIND_STRUCTURES, {
            filter: (s) => {
                let sType = s.structureType;

                // Don't repair owned structures that aren't ours.
                if( s instanceof OwnedStructure && !s.my ) {
                    // console.log("Not my structure: " + sType + " " + s.id + " " + s.my);
                    return false;
                }

                switch( sType ) {
                case STRUCTURE_SPAWN:
                case STRUCTURE_EXTENSION:
                    return s.hits < s.hitsMax;
                case STRUCTURE_WALL:
                case STRUCTURE_RAMPART:
                    return s.hits < defs.WALL_BUILD_FIX;
                default:
                    return s.hits < s.hitsMax / 2;
                }
            }
        });

        // Create tasks with priority and place them task list
        let foundNewTasks = false;
        repairTargets.forEach(target => {
            let prio;
            switch( target.structureType ) {
            case STRUCTURE_SPAWN:
            case STRUCTURE_EXTENSION:
                prio = Task.PRIORITY.URGENT;
                break;
            case STRUCTURE_WALL:
            case STRUCTURE_RAMPART:
                prio = Task.PRIORITY.HIGH;
                break;
            default:
                prio = Task.PRIORITY.LOW;
                break;
            }

            let newTask = Task.toMemoryObject(defs.TASKS.REPAIR, target.id, Task.STATUS.TODO, prio);
            console.log('For target', target.structureType, ', adding new Task to memory:', JSON.stringify(newTask));
            foundNewTasks = foundNewTasks || this.addToTaskList(newTask);
        });

        return foundNewTasks;
    }

    static getRoomInfo(room) {
        let info = {},
            sources = room.find(FIND_SOURCES),
            minerals = room.find(FIND_MINERALS);

        if( sources.length ) {
            info.sources = {};
            for(const s of sources) {
                info.sources[s.id] = {x: s.pos.x, y: s.pos.y};
            }
        }

        if( minerals.length ) {
            info.minerals = {};
            for(const m of minerals) {
                info.minerals[m.id] = {x: m.pos.x, y: m.pos.y};
            }
        }

        info.exits = Game.map.describeExits(room.name);

        return info;
    }
}

module.exports = RoomManager;