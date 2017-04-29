'use strict';

const TYPES_PRIORITY = {
    [STRUCTURE_SPAWN]: 1,
    [STRUCTURE_EXTENSION]: 0,
    [STRUCTURE_TOWER]: 2,
    [STRUCTURE_STORAGE]: 3,
    
    get: function(sType) {
        // console.log("getting prio for " + sType + " =" + TYPES_PRIORITY[sType]);
        return TYPES_PRIORITY[sType];
    }
};

let roleHarvester = {

    /** @param creep Creep **/
    run: function(creep) {
        if( creep.memory.shouldFetch && creep.carry.energy < creep.carryCapacity) {
            let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => { return s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > creep.carryCapacity; }
            });
            if(creep.withdraw(container,RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            creep.memory.shouldFetch = false;
            
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    let fillMe = structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER ||
                        structure.structureType === STRUCTURE_STORAGE;
                        
                    if( structure.structureType === STRUCTURE_STORAGE ) {
                        // console.log("found a container " + structure.id + " with resources " + _.sum(structure.store));
                        fillMe = fillMe && _.sum(structure.store) < structure.storeCapacity;
                    } else {
                        fillMe = fillMe && structure.energy < structure.energyCapacity;
                    }
                    
                    return fillMe;
                }
            });
            
            if(targets.length > 0) {
                targets = targets.sort(function(a,b) {
                    let ap = TYPES_PRIORITY.get(a.structureType),
                        bp = TYPES_PRIORITY.get(b.structureType);

                    return ap - bp;
                }).filter(function(e) {
                    return e.structureType === targets[0].structureType;
                });

                let t = creep.pos.findClosestByRange(targets);
                if(creep.transfer(t, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(t, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            
            if( _.sum(creep.carry) === 0 ) {
                creep.memory.shouldFetch = true;
            }
        }
    }
};

module.exports = roleHarvester;