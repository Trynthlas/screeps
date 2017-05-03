'use strict';

const defs        = require('defs'),
      Task        = require('Task'),
      TaskFactory = require('TaskFactory'),
      profiler    = require('screeps-profiler');

class Tower {
    constructor(theTower) {
        if( !theTower || !theTower instanceof Tower.expectedClass ) {
            throw new TypeError('Class Tower was passed a non StructureTower instance');
        }

        this.me = theTower;

        if( _.isUndefined(this.me.memory.tasks) ) {
            this.me.memory.tasks = [];
        }

        this.tasks = _.clone(this.me.memory.tasks);
        // this.tasks = this.me.memory.tasks = [];
    }

    static get expectedClass() {
        return StructureTower;
    }

    doNextTask() {
        // If we're out of tasks, or the room has a new, higher-priority (lower prio value) task, update our task list
        if( !this.tasks.length || (this.tasks.length && this.tasks[0].prio > this.me.room.memory.taskList[0].prio) ) {
            this.getNewTasksFromRoom();
        } else {
            //console.log('Tower: not getting new room tasks');
        }

        while( this.tasks.length ) {
            let task = TaskFactory.createTask(this.tasks[0], this.me);

            console.log('Tower: looking at task', JSON.stringify(this.tasks[0]), 'of', this.tasks.length);

            if( task.isComplete() ) {
                this.finishTask(task);
            } else {
                this.tasks[0].status = task.execute(this.me);
                break;
            }
        }

        this.me.memory.tasks = this.tasks;
        // console.log('Tower # tasks in memory:',this.me.memory.tasks.length);
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

    getNewTasksFromRoom() {
        let roomTasks = this.me.room.memory.taskList.filter(task => {
            return task.taskType === defs.TASKS.ATTACK && Game.getObjectById(task.targetId) instanceof Creep ||
                   task.taskType === defs.TASKS.REPAIR &&
                   !_.some(this.tasks, task);
        });

        if( roomTasks.length ) {
            // Combine new tasks with any existing
            console.log('Tower: found valid tasks from room', JSON.stringify(roomTasks));
            this.tasks = this.tasks.concat(roomTasks);
            console.log('Tower: merged room tasks', this.tasks.length);

            // Sort the task list and set it in memory
            this.tasks = _.sortBy(this.tasks, 'prio');
            this.me.memory.tasks = this.tasks;
        }
    }
}

profiler.registerClass(Tower, 'Tower');

module.exports = Tower;