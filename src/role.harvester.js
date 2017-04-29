'use strict';

const TYPES_PRIORITY = {
    NO_PORTERS: {
        [STRUCTURE_SPAWN]: 2,
        [STRUCTURE_EXTENSION]: 1,
        [STRUCTURE_CONTAINER]: 3,
        [STRUCTURE_TOWER]: 3,
        [STRUCTURE_STORAGE]: 4,
    },

    YES_PORTERS: {
        [STRUCTURE_CONTAINER]: 1,
        [STRUCTURE_STORAGE]: 2,
        [STRUCTURE_SPAWN]: 4,
        [STRUCTURE_EXTENSION]: 3,
        [STRUCTURE_TOWER]: 5,
    },
    
    get: function(sType, porters) {
        // console.log("getting prio for " + sType + " =" + TYPES_PRIORITY[sType]);
        return porters ? TYPES_PRIORITY.YES_PORTERS[sType] : TYPES_PRIORITY.NO_PORTERS[sType];
    }
};

let roleHarvester = {

    /**
     * @param creep Creep
     * @param {boolean} withPorters
     */
    run: function(creep, withPorters) {
        if( creep.memory.shouldHarvest && creep.carry.energy < creep.carryCapacity) {
            let sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            creep.memory.shouldHarvest = false;
            
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    let fillMe = structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER ||
                        structure.structureType === STRUCTURE_CONTAINER ||
                        structure.structureType === STRUCTURE_STORAGE;
                        
                    if( structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE ) {
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
                    let ap = TYPES_PRIORITY.get(a.structureType, withPorters),
                        bp = TYPES_PRIORITY.get(b.structureType, withPorters);

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
                creep.memory.shouldHarvest = true;
            }
        }
    }
};

module.exports = roleHarvester;