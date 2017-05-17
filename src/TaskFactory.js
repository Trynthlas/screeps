'use strict';

const defs = require('defs');
const Task = require('Task');
const TowerRepairTask = require('Task.TowerRepair');
const TowerAttackTask = require('Task.TowerAttack');

class TaskFactory {
    constructor() {
    }

    static createTask(memoryInfo, actor) {
        switch( memoryInfo.taskType ) {
        case TASKS.ATTACK:
            if( actor instanceof StructureTower ) {
                return new TowerAttackTask(memoryInfo.taskType, memoryInfo.targetId, memoryInfo.status, memoryInfo.prio);
            }
            break;
        case TASKS.REPAIR:
            if( actor instanceof StructureTower ) {
                return new TowerRepairTask(memoryInfo.taskType, memoryInfo.targetId, memoryInfo.status, memoryInfo.prio);
            } else if( actor instanceof Creep ) {
                // return new CreepRepairTask(
            }
            break;
        default:
            throw new TypeError('Unsupported Task type');
        }
    }
}

module.exports = TaskFactory;