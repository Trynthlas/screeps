'use strict';

class Task {
    constructor(taskType, targetId, status, prio) {
        this.taskType = taskType;
        this.targetId = targetId;
        this.status = status;
        this.prio = prio;

        this.target = Game.getObjectById(targetId);
        if( !this.target ) {
            this.status = Task.STATUS.DONE;
        }
    }

    static toMemoryObject(taskType, targetId, status, prio) {
        return {
            'taskType': taskType || this.taskType,
            'targetId': targetId || this.targetId,
            'status':   status !== undefined ? status : this.status,
            'prio':     prio !== undefined ? prio : this.prio
        };
    }

    static get comparator() {
        return function(a, b) {
            return a.prio - b.prio;
        };
    }

    static get STATUS() {
        return Object.freeze({TODO: 0, DONE: 1});
    }

    static get PRIORITY() {
        return Object.freeze({
            IMMEDIATE: 1,
            URGENT:    2,
            HIGH:      3,
            NORMAL:    4,
            LOW:       5
        });
    }

    execute(actor) {
        throw new TypeError('Must implement method');
    }

    isComplete(target) {
        throw new TypeError('Must implement method');
    }
}

module.exports = Task;