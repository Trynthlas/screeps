'use strict';

const defs  = require('defs'),
      Task  = require('Task'),
      Tower = require('Tower');

/**
 * Memory.rooms[room]: {
 *      info: {
 *          sources: {
 *              <sourceId>: {RoomPosition}
 *          },
 *          minerals: {
 *              <mineralId>: {RoomPosition}
 *          },
 *          exits: {
 *              <1|3|5|7>: <roomName>
 *          }
 *      },
 *      sourceContainers: {
 *          <sourceId>: {
 *              container: <containerId>,
 *              pos: {RoomPosition}
 *          }
 *      },
 *      towers: [<towerId>,...],
 *      spawns; [<spawnName>,...],
 *      taskList: [<task>,...],
 * }
 *
 */

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
        if( _.isUndefined(this.me.memory.sourceContainers) ) {
            this.me.memory.sourceContainers = {};
        }
        if( _.isUndefined(this.me.memory.taskList) ) {
            this.me.memory.taskList = [];
        }
        if( _.isUndefined(this.me.memory.towers) ) {
            this.me.memory.towers = [];
        }
        if( _.isUndefined(this.me.memory.spawns) ) {
            this.me.memory.spawns = [];
        }
    }

    static get expectedClass() {
        return Room;
    }

    /**
     * The main room execution function. Handles updating information and taskList.
     */
    runRoom() {
        if( Game.time % ROOM_UPDATE_INTERVAL === 0 ) {
            this.updateRoom();
        }

        this.updateTasks();

        if( this.runTowers() !== OK ) {
            this.updateStructures();
            this.runTowers();
        }
    }

    /**
     * Execute tasks for each tower in the room
     *
     * @returns {number}
     *  OK if successful
     *  ERR_INVALID_TARGET if there was a TypeError; usually this indicates the tower is missing
     */
    runTowers() {
        // console.log('runTowers on',JSON.stringify(this.me.memory.towers));
        for( const id of this.me.memory.towers ) {
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

    /**
     * Clears out completed tasks
     */
    pruneTasks() {
        this.me.memory.taskList = _.filter(this.me.memory.taskList, 'status', Task.STATUS.TODO);
    }

    /**
     * Find all the things to do and update the taskList
     */
    updateTasks() {
        let listLen;

        this.pruneTasks();
        listLen = this.me.memory.taskList.length;

        this.findHostiles();

        if( Game.time % ROOM_FIND_REPAIR_INTERVAL === 0 || !this.me.memory.taskList.find(t => {
                return t.taskType === defs.TASKS.REPAIR;
            }) ) {
            this.findRepairTasks();
        }

        // Only sort if there are new tasks
        if( listLen !== this.me.memory.taskList.length ) {
            this.me.memory.taskList = _.sortBy(this.me.memory.taskList, 'prio');
        }
    }

    /**
     * Updates various parts of the room in memory.
     * Do expensive operations here. Also for things that don't need to run often, like updating structure refs
     */
    updateRoom() {
        this.updateStructures();

        // purge tasks
        this.me.memory.taskList = [];
    }

    /**
     * Scans the room for our structures (that can do things) and stores them in the room's memory.
     */
    updateStructures() {
        let structures = this.me.find(FIND_MY_STRUCTURES, {
            filter: (s) => {
                return s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_SPAWN;
            }
        });

        this.me.memory.towers.length = 0;
        this.me.memory.spawns.length = 0;

        for( const s of structures ) {
            switch( s.structureType ) {
            case STRUCTURE_TOWER:
                this.me.memory.towers.push(s.id);
                break;
            case STRUCTURE_SPAWN:
                this.me.memory.spawns.push(s.name);
                break;
            }
        }
    }

    /**
     * Adds a task to the taskList if it is not already present
     *
     * @param t the task to add
     * @returns {boolean} true if the task was added to the taskList
     */
    addToTaskList(t) {
        if( !_.some(this.me.memory.taskList, t) ) {
            console.log('Adding task', JSON.stringify(t), 'to taskList');
            this.me.memory.taskList.push(t);
            return true;
        }

        return false;
    }

    /**
     * Finds hostile creeps and assigns ATTACK tasks for them
     */
    findHostiles() {
        let hostiles = this.me.find(FIND_HOSTILE_CREEPS);

        if( hostiles.length ) {
            // First partition = hostile fighters
            // Second partition = other hostiles
            let enemies = _.partition(hostiles, (c) => {
                console.log('Looking at hostile creep: attack=', c.getActiveBodyparts(ATTACK), 'ranged=', c.getActiveBodyparts(RANGED_ATTACK), 'heal=',
                    c.getActiveBodyparts(HEAL));
                return c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK) || c.getActiveBodyparts(HEAL);
            });

            console.log('Enemy fighters:', enemies[0].length);
            console.log('Other enemy creeps:', enemies[1].length);

            enemies[0].forEach(enemy => {
                this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.IMMEDIATE));
            });
            enemies[1].forEach(enemy => {
                this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.URGENT));
            });
        }
    }

    /**
     * Finds structures that need repair and creates tasks for doing so
     */
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
            this.addToTaskList(newTask);
        });
    }

    static getRoomInfo(room) {
        let info     = {},
            sources  = room.find(FIND_SOURCES),
            minerals = room.find(FIND_MINERALS);

        if( sources.length ) {
            info.sources = {};
            for( const s of sources ) {
                info.sources[s.id] = {x: s.pos.x, y: s.pos.y, name: room.name};
            }
        }

        if( minerals.length ) {
            info.minerals = {};
            for( const m of minerals ) {
                info.minerals[m.id] = {x: m.pos.x, y: m.pos.y, name: room.name};
            }
        }

        info.exits = Game.map.describeExits(room.name);

        return info;
    }

    /**
     * Gets a RoomPosition of a container directly adjacent to a source.
     * First checks the room memory for a record, and if not present places the results of a successful search into room memory.
     *
     * @param sourceId the id of the Source around which to look
     * @returns {RoomPosition|undefined} the RoomPosition of the container, or undefined if one is not found
     */
    static getContainerPositionForSource(sourceId) {
        if( !_.isUndefined(this.me.memory.sourceContainers[sourceId]) ) {
            return _.create(RoomPosition.prototype, this.me.memory.sourceContainers[sourceId].pos);
        } else {
            let containers = Game.getObjectById(sourceId).pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_CONTAINER});
            if( containers.length ) {
                let c = containers[0];
                this.me.memory.sourceContainers[sourceId] = {
                    container: c.id,
                    pos:       {x: c.pos.x, y: c.pos.y, roomName: c.room.name}
                };

                return c.pos;
            }
        }

        return undefined;
    }
}

module.exports = RoomManager;