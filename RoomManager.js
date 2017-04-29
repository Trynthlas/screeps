'use strict';

const defs = require('defs'),
    Task = require('Task'),
    Tower = require('Tower');

/**
 * Manages an individual Room
 */
class RoomManager {
    constructor(room) {
        if (!room instanceof RoomManager.expectedClass) {
            throw new TypeError('Class RoomManager was passed a non Room instance');
        }

        this.me = room;

        if (_.isUndefined(this.me.memory.taskList))
            this.me.memory.taskList = [];
        if (_.isUndefined(this.me.memory.towers))
            this.me.memory.towers = [];

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
        for(const id of this.towers) {
            let tower;
            try {
                tower = new Tower(Game.getObjectById(id));
                tower.doNextTask();
            } catch(ex) {
                if( ex instanceof TypeError ) {
                    console.log('Error while running towers!',ex);
                    return ERR_INVALID_TARGET;
                } else {
                    throw ex;
                }
            }
        }

        return OK;
    }

    findHostiles() {
        let hostiles = this.me.find(FIND_HOSTILE_CREEPS);
        if( !hostiles.length ) {
            return;
        }

        // First partition = hostile fighters
        // Second partition = other hostiles
        let enemies = _.partition(hostiles, (c) => {
            console.log('Looking at hostile creep',JSON.stringify(c));
            return c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK) || c.getActiveBodyparts(HEAL);
        });

        console.log('Enemy fighters:',enemies[0].length);
        console.log('Other enemy creeps:',enemies[1].length);

        enemies[0].forEach(enemy => {
            this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.IMMEDIATE));
        });
        enemies[1].forEach(enemy => {
            this.addToTaskList(Task.toMemoryObject(defs.TASKS.ATTACK, enemy.id, Task.STATUS.TODO, Task.PRIORITY.URGENT));
        });
    }

    findStructuresToRepair() {
        let repairTargets = this.me.find(FIND_STRUCTURES, {
            filter: (s) => {
                let sType = s.structureType;

                // Don't repair owned structures that aren't ours.
                if( s instanceof OwnedStructure && !s.my ) {
                    // console.log("Not my structure: " + sType + " " + s.id + " " + s.my);
                    return false;
                }

                switch (sType) {
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
            switch(target.structureType) {
                case STRUCTURE_SPAWN:
                case STRUCTURE_EXTENSION:
                    prio = Task.PRIORITY.URGENT; break;
                case STRUCTURE_WALL:
                case STRUCTURE_RAMPART:
                    prio = Task.PRIORITY.HIGH; break;
                default:
                    prio = Task.PRIORITY.LOW; break;
            }

            let newTask = Task.toMemoryObject(defs.TASKS.REPAIR, target.id, Task.STATUS.TODO, prio);
            console.log('For target',target.structureType,', adding new Task to memory:',JSON.stringify(newTask));
            this.addToTaskList(newTask);
        });
    }

    addToTaskList(t) {
        if( !_.includes(this.taskList, t) ) {
            this.taskList.push(t);
        }
    }

    pruneTasks() {
        this.taskList = _.filter(this.taskList, 'status', Task.STATUS.TODO);
    }

    updateTasks() {
        this.pruneTasks();
        this.findHostiles();

        if (!this.taskList.find(t => { return t.taskType === defs.TASKS.REPAIR })) {
            this.findStructuresToRepair();
        }

        // Write to memory
        this.me.memory.taskList = _.sortBy(this.taskList, [Task.comparator]);
    }

    updateRoom() {
        this.updateTowers();
    }

    updateTowers() {
        let towers = this.me.find( FIND_MY_STRUCTURES, {filter: (s) => { return s.structureType === STRUCTURE_TOWER; }} );
        this.towers.length = 0;
        for(const t of towers) {
            this.towers.push(t.id);
        }
    }
}

module.exports = RoomManager;