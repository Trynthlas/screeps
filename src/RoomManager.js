'use strict';

const defs    = require('defs'),
      helpers = require('helpers'),
      Task    = require('Task'),
      Tower   = require('Tower');

/**
 * Memory.rooms[room]: {
 *      sources: [<sourceId>,...],
 *      minerals: [<mineralId>,...],
 *      exits: {
 *          <TOP|RIGHT|BOTTOM|LEFT>: <roomName>
 *      },
 *      towers: [<towerId>,...],
 *      extensions: [<extensionId>,...],
 *      spawns; [<spawnName>,...],
 *
 *      sourceContainers: {
 *          <sourceId>: {
 *              container: <containerId>,
 *              pos: {RoomPosition}
 *          }
 *      },
 *      taskList: [<task>,...],
 *      spawnQ: [<{creepRole, priority}>,...],
 *      status: <RoomStatus>
 * }
 */

const RoomStatus = {
    ROOM_NORMAL: 0,
    ROOM_HOSTILES: 1,
    ROOM_PANIC: 2
};


let EnergyStoragePriorityMap = new Map();
EnergyStoragePriorityMap.set(RoomStatus.ROOM_NORMAL, [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_TERMINAL]);
EnergyStoragePriorityMap.set(RoomStatus.ROOM_HOSTILES, [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_TERMINAL]);
EnergyStoragePriorityMap.set(RoomStatus.ROOM_PANIC, [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_TERMINAL]);


/**
 * Manages an individual Room
 */
class RoomManager {
    constructor(room) {
        if( !room instanceof RoomManager.expectedClass ) {
            throw new TypeError('Class RoomManager was passed a non Room instance');
        }

        this.me = room;

        if( _.isUndefined(this.me.memory.sourceContainers) ) {
            this.me.memory.sourceContainers = {};
        }
        if( _.isUndefined(this.me.memory.taskList) ) {
            this.me.memory.taskList = [];
        }
        if( _.isUndefined(this.me.memory.spawnQ) ) {
            this.me.memory.spawnQ = [];
        }
    }

    static get expectedClass() {
        return Room;
    }

    get roomStatus() {
        if( !this.me.memory.status ) {
            this.roomStatus = RoomStatus.ROOM_NORMAL;
        }
        return this.me.memory.status;
    }

    set roomStatus(status) {
        if( !_.isUndefined(RoomStatus[status]) ) {
            this.me.memory.status = status;
        } else {
            throw new Error('Status code ' + status + ' is not a valid RoomStatus');
        }
    }

    /**
     * The main room execution function. Handles updating information and taskList.
     */
    runRoom() {
        this.updateTasks();

        if( this.runTowers() !== OK ) {
            // Force towers to be re-fetched
            this.me.towers = undefined;
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
        for( const t of this.me.towers ) {
            try {
                let tower = new Tower(t);
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

    runSpawns() {
        for(const spawn of this.me.spawns) {
            if( !spawn.spawning && this.me.memory.spawnQ.length ) {

            }
        }
    }

    /**
     * Adds a request for a creep to be spawned by the room
     *
     * @param creepDef {string|object}
     * @param priority
     */
    addCreepToSpawnQ(creepDef, priority) {
        let spawnObj = {
            role: creepDef instanceof String ? creepDef : creepDef.role,
            body: creepDef instanceof String ? undefined : creepDef.body,
            prio: priority
        };

        helpers.insertToPriorityQueue(spawnObj, this.me.memory.spawnQ, 'prio');
    }

    /**
     * Clears out completed tasks
     */
    pruneTasks() {
        this.me.memory.taskList = _.filter(this.me.memory.taskList, 'status', Task.STATUS.TODO);
    }

    purgeTasks() {
        this.me.memory.taskList.length = 0;
    }

    /**
     * Find all the things to do and update the taskList
     */
    updateTasks() {
        let listLen;

        this.pruneTasks();
        listLen = this.me.memory.taskList.length;

        this.findHostiles();

        if( Game.time % ROOM_FIND_REPAIR_INTERVAL === 0 ) {
            this.findRepairTasks();
        }

        // Only sort if there are new tasks
        if( listLen !== this.me.memory.taskList.length ) {
            this.me.memory.taskList = _.sortBy(this.me.memory.taskList, 'prio');
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
                this.addToTaskList(Task.toMemoryObject(TASKS.ATTACK, enemy.id, Task.STATUS.TODO, PRIORITY.IMMEDIATE));
            });
            enemies[1].forEach(enemy => {
                this.addToTaskList(Task.toMemoryObject(TASKS.ATTACK, enemy.id, Task.STATUS.TODO, PRIORITY.URGENT));
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
                    return s.hits < WALL_BUILD_FIX;
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
                prio = PRIORITY.URGENT;
                break;
            case STRUCTURE_WALL:
            case STRUCTURE_RAMPART:
                prio = PRIORITY.HIGH;
                break;
            default:
                prio = PRIORITY.LOW;
                break;
            }

            let newTask = Task.toMemoryObject(TASKS.REPAIR, target.id, Task.STATUS.TODO, prio);
            console.log('For target', target.structureType, ', adding new Task to memory:', JSON.stringify(newTask));
            this.addToTaskList(newTask);
        });
    }

    getTargetContainerForResource(resourceType) {
        let containers;
        switch(resourceType) {
        case RESOURCE_ENERGY:
            containers = EnergyStoragePriorityMap.get(this.roomStatus);
            break;
        default:
            return this.me.storage ? this.me.storage : undefined;
        }

        let toFill;
        for( const c of containers ) {
            switch(c) {
            case STRUCTURE_SPAWN:
            case STRUCTURE_EXTENSION:
            case STRUCTURE_TOWER:
                let structs = this.me.getStructuresByType(c);
                toFill = _.filter(structs, s => s.energy < s.energyCapacity);
                if( toFill.length ) {
                    return toFill;
                }
                break;
            case STRUCTURE_STORAGE:
            case STRUCTURE_TERMINAL:
                let s = this.me.getStructuresByType(c);
                if( s.amount < s.storeCapacity ) {
                    return [s];
                }
                break;
            }
        }

        return null;
    }

    /**
     * Gets a RoomPosition of a container directly adjacent to a source.
     * First checks the room memory for a record, and if not present places the results of a successful search into
     * room memory.
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

let rmPool = {
    getManager: function(roomName) {
        if( !roomName ) {
            throw new ReferenceError(`Can't get RoomManager for empty room name`);
        }

        if( !this[roomName] ) {
            try {
                this[roomName] = new RoomManager(Game.rooms[roomName]);
            } catch( e ) {
                Game.notify(`Failed to create RoomManager for ${roomName}. Error: ${e}`, 5);
                throw new ReferenceError(`${roomName} not found in Game.rooms`);
            }
        }

        return this[roomName];
    }
};

module.exports = rmPool;