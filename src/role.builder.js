const defs = require('defs');

let roleBuilder = {

    /** @param creep Creep **/
    run: function(creep) {

        if( creep.memory.building && creep.carry.energy === 0 ) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        } else if( !creep.memory.building && creep.carry.energy === creep.carryCapacity ) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if( creep.memory.building ) {
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if( targets.length ) {
                let t = creep.pos.findClosestByRange(targets);
                if( creep.build(t) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(t, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                let t = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        let sType = structure.structureType;

                        if( structure instanceof OwnedStructure && !structure.my ) {
                            console.log('Not my structure: ' + sType + ' ' + structure.id + ' ' + structure.my);
                            return false;
                        }

                        switch( sType ) {
                        case STRUCTURE_WALL:
                            return structure.hits < defs.WALL_BUILD_MAX;
                        case STRUCTURE_RAMPART:
                            return structure.hits < defs.WALL_BUILD_FIX;
                        default:
                            return structure.hits < structure.hitsMax / 2;
                        }
                    }
                });

                if( t && creep.repair(t) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(t, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        else {
            let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => {
                    let sType = s.structureType;
                    return (sType === STRUCTURE_CONTAINER || sType === STRUCTURE_STORAGE) && s.store[RESOURCE_ENERGY] > 0;
                }
            });

            if( container ) {
                // console.log(creep.name + " found container with " + container.store[RESOURCE_ENERGY] + " energy");
                creep.memory.shouldHarvest = false;

                let ec = creep.withdraw(container, RESOURCE_ENERGY);

                if( ec === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                } else if( ec === ERR_NOT_ENOUGH_RESOURCES ) {
                    creep.memory.shouldHarvest = true;
                }
            } else {
                creep.memory.shouldHarvest = true;
            }

            // console.log(creep.name + " shouldHarvest? " + creep.memory.shouldHarvest);
            if( creep.memory.shouldHarvest ) {
                let closestSource = creep.pos.findClosestByRange(FIND_SOURCES, {
                    filter: (s) => {
                        return s.energy > 500;
                    }
                });
                if( creep.harvest(closestSource) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(closestSource, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
};

module.exports = roleBuilder;