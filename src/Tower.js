'use strict';

const defs        = require('defs'),
      Task        = require('Task'),
      TaskFactory = require('TaskFactory');
//profiler    = require('./screeps-profiler')


const ATTACK_POWER = [600, 600, 600, 600, 600, 570, 540, 510, 480, 450, 420, 390, 360, 330, 300, 270, 240, 210, 180, 150];
const HEAL_POWER = [400, 400, 400, 400, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100];
const REPAIR_POWER = [800, 800, 800, 800, 800, 760, 720, 680, 640, 600, 560, 520, 480, 440, 400, 360, 320, 280, 240, 200];

const HOSTILE_HEAL_PART_VALUE = [0, 10, 10, 10, 38, 45, 52, 59, 66, 73, 80, 100];
const HOSTILE_ATTACK_PART_VALUE = [0, 30, 30, 30, 30, 30, 30, 30, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100];
const HOSTILE_RANGED_PART_VALUE = [0, 10, 10, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100];
const TOWER_DISTANCE_VALUE = [100, 100, 100, 100, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25];
const HOSTILE_WORK_CARRY_PART_VALUE = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100];

class Tower {
    constructor(theTower) {
        if( !theTower || !theTower instanceof Tower.expectedClass ) {
            throw new TypeError('Class Tower was passed a non StructureTower instance');
        }

        this.me = theTower;

        if( _.isUndefined(this.me.memory.tasks) ) {
            this.me.memory.tasks = [];
        }

        this.tasks = this.me.memory.tasks;
    }

    static get expectedClass() {
        return StructureTower;
    }

    doNextTask() {
        // If we're out of tasks, or the room has a new, higher-priority (lower prio value) task, update our task list
        if( !this.tasks.length || (this.tasks.length && this.tasks[0].prio > this.me.room.memory.taskList[0].prio) ) {
            this.updateTasksFromRoom();
        }

        while( this.tasks.length ) {
            let task = TaskFactory.createTask(this.selectTaskFromList(), this.me);
            //console.log('Got task:',JSON.stringify(task));

            if( task.isComplete() ) {
                this.finishTask(task);
            } else {
                this.tasks[0].status = task.execute(this.me);
                break;
            }
        }
    }

    /**
     * Looks for the matching task in the room's taskList and updates its status; then,
     * clears the task from the local task array.
     *
     * @param task the completed task
     */
    finishTask(task) {
        let idx = this.me.room.memory.taskList.findIndex(t => {
            return task.taskType === t.taskType && task.targetId === t.targetId && t.prio === task.prio;
        });
        if( idx !== -1 ) {
            this.me.room.memory.taskList[idx].status = Task.STATUS.DONE;
            // console.log('Room task status after update:',this.me.room.memory.taskList[idx].status);
        }

        this.tasks.shift();
        console.log('Tower: tasks remaining:', this.tasks.length);
    }

    updateTasksFromRoom() {
        let roomTasks = this.me.room.memory.taskList.filter(task => {
            let target = Game.getObjectById(task.targetId);
            return (task.taskType === defs.TASKS.ATTACK && target instanceof Creep) ||
                   (task.taskType === defs.TASKS.REPAIR && target.structureType !== STRUCTURE_WALL) &&
                   !_.some(this.tasks, task);
        });

        if( roomTasks.length ) {
            // Combine new tasks with any existing
            console.log('Tower: found valid tasks from room', JSON.stringify(roomTasks));
            this.tasks = this.tasks.concat(roomTasks);
            console.log('Tower: merged room tasks', this.tasks.length);

            // Sort the task list
            this.tasks = _.sortBy(this.tasks, ['prio', 'taskType']);
        }
    }

    selectTaskFromList() {
        let topPrio = this.tasks[0].prio,
            choices = _.filter(this.tasks, (t) => t.prio === topPrio),
            bestTarget;

        console.log('Tower: selecting tasks based on prio', topPrio, 'with', choices.length, 'choices');

        // For equal priority tasks, further prioritize by task type and target importance
        if( _.some(choices, (c) => c.taskType === defs.TASKS.ATTACK) ) {
            //console.log('Tower: trying to select attacks');
            _.forEach(_.filter(choices, (c) => c.taskType === defs.TASKS.ATTACK), (t) => {
                let targetRating = this._calculateAttackTargetRating(t.targetId);
                if( !bestTarget || targetRating > bestTarget.rating ) {
                    bestTarget = {target: t.targetId, rating: targetRating};
                    console.log('Tower: got best ATTACK target as', JSON.stringify(bestTarget));
                }
            });
        }

        if( _.some(choices, (c) => c.taskType === defs.TASKS.HEAL) ) {
            //console.log('Tower: trying to select heals');
            _.forEach(_.filter(choices, (c) => c.taskType === defs.TASKS.HEAL), (t) => {
                let rating = Tower.getPowerForDistance(HEAL_POWER, this.me.pos.getRangeTo(t)) * 0.25;
                if( !bestTarget || rating > bestTarget.rating ) {
                    bestTarget = {target: t.targetId, rating: rating};
                    //console.log('Tower: got best HEAL target as',JSON.stringify(bestTarget));
                }
            });
        }

        if( !bestTarget && _.some(choices, (c) => c.taskType === defs.TASKS.REPAIR) ) {
            //console.log('Tower: trying to select repairs');
            let repairs = [];
            _.forEach(_.filter(choices, (c) => c.taskType === defs.TASKS.REPAIR), (t) => {
                repairs.push(Game.getObjectById(t.targetId));
            });

            bestTarget = {target: this.me.pos.findClosestByRange(repairs).id};
            //console.log('Tower: got best REPAIR target as',JSON.stringify(bestTarget));

        }

        console.log('Tower selecting best target as', JSON.stringify(bestTarget));
        return bestTarget ? _.find(this.tasks, (t) => {
            return t.targetId === bestTarget.target && t.prio === topPrio;
        }) : null;
    }

    _calculateAttackTargetRating(targetId) {
        let target = Game.getObjectById(targetId);
        if( target.room.name !== this.me.room.name ) {
            return ERR_INVALID_TARGET;
        }

        // Target selection factors:
        //      heal parts
        //      attack parts
        //      range attack parts
        //      distance (dmg tower would do)
        //      work parts
        //      carry parts

        let healVal   = HOSTILE_HEAL_PART_VALUE[Math.min(target.getActiveBodyparts(HEAL), 10)],
            attackVal = HOSTILE_ATTACK_PART_VALUE[Math.min(target.getActiveBodyparts(ATTACK), 25)],
            rangeVal  = HOSTILE_RANGED_PART_VALUE[Math.min(target.getActiveBodyparts(RANGED_ATTACK), 25)],
            towerVal  = TOWER_DISTANCE_VALUE[Math.min(this.me.pos.getRangeTo(target), TOWER_FALLOFF_RANGE - 1)],
            workVal   = HOSTILE_WORK_CARRY_PART_VALUE[Math.min(target.getActiveBodyparts(WORK), 25)],
            carryVal  = HOSTILE_WORK_CARRY_PART_VALUE[Math.min(target.getActiveBodyparts(CARRY), 25)];

        // Weighted Valuation
        let hostileRating = healVal * 0.6 + attackVal * 0.4 + rangeVal * 0.25 + towerVal * 0.5 + workVal * 0.15 + carryVal * 0.1;
        console.log(
            `calculateAttackTargetRating:: healVal=${healVal} attackVal=${attackVal} rangeVal=${rangeVal} towerVal=${towerVal} workVal=${workVal} carryVal=${carryVal}`);
        console.log(`calculateAttackTargetRating:: RATING = ${hostileRating}`);
        return hostileRating;
    }

    /**
     * Looks up the power value of the Tower for a given distance
     *
     * @param powArr {Array} the power array in which to look up the value, eg ATTACK_POWER
     * @param dist {number} the distance to the target
     */
    static getPowerForDistance(powArr, dist) {
        return dist > powArr.length ? powArr[powArr.length - 1] : powArr[dist - 1];
    }
}

//profiler.registerClass(Tower, 'Tower');

module.exports = Tower;