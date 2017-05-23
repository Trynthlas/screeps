'use strict';

const defs    = require('defs'),
      helpers = require('helpers');

class CreepBuilder {
    static buildCreepForRole(room, role, target, targetContainer) {
        switch( role ) {
        case ROLES.HARVESTER_STATIC:
            return CreepBuilder.buildStaticHarvester(room);
        case ROLES.HARVESTER_MOBILE:
            return CreepBuilder.buildMobileHarvester(room, target, targetContainer);
        case ROLES.HAULER:
            return CreepBuilder.buildHauler(room, target, targetContainer);
        case ROLES.FLEX_WORKER:
        case ROLES.UPGRADER:
            return CreepBuilder.buildFlexWorker(room);
        }
    }

    /**
     * Builds a harvester creep body intended for sitting at the source without moving
     *
     * @param room The room in which the creep will be spawned
     * @returns {Array} an array describing the creep body
     */
    static buildStaticHarvester(room) {
        // maxEnergy = BODYPART_COST.work * num + BODYPART_COST.move * (num/2 + 1) + BODYPART_COST.carry
        // maxEnergy = 100*num + 50*(num/2 + 1) + 50
        let num = Math.floor(((room.energyCapacityAvailable - BODYPART_COST.carry) - BODYPART_COST.move) / (BODYPART_COST.work + BODYPART_COST.move / 2));
        num = Math.min(num, 7);

        return helpers.RLD([
            num, WORK,
            1, CARRY,
            Math.ceil((num + 1) / 2), MOVE
        ]);
    }

    static buildMobileHarvester(room, target, targetContainer) {
        // maxEnergy = BODYPART_COST.work * num + BODYPART_COST.carry * num / 2 + BODYPART_COST.move * num * 3/2
        let num = Math.floor(room.energyCapacityAvailable * 2 / (BODYPART_COST.work * 2 + BODYPART_COST.carry + BODYPART_COST.move * 3));

        return helpers.RLD([
            num, WORK,
            Math.max(1, Math.floor(num / 2)), CARRY,
            Math.ceil(3 * num / 2), MOVE
        ]);
    }

    static buildHauler(room, target, targetContainer) {
        let num;
        if( target && targetContainer ) {
            let result = PathFinder.search(target.pos, {pos: targetContainer.pos, range: 1}, {
                maxOps:       1000,
                plainCost:    2,
                swampCost:    10,
                roomCallback: function(roomName) {
                    let room = Game.rooms[roomName];
                    if( !room ) {
                        return;
                    }

                    let costMatrix = room.memory.costMatrix;
                    if( costMatrix && Game.time - costMatrix.time < 100 ) {
                        return PathFinder.CostMatrix.deserialize(costMatrix);
                    } else {
                        costMatrix = new PathFinder.CostMatrix;
                        _.forEach(room.find(FIND_STRUCTURES), s => {
                            if( s.structureType === STRUCTURE_ROAD ) {
                                costMatrix.set(s.pos.x, s.pos.y, 1);
                            } else if( s.structureType !== STRUCTURE_CONTAINER && (s.structureType !== STRUCTURE_RAMPART || !s.my) ) {
                                costMatrix.set(s.pos.x, s.pos.y, 255);
                            }
                        });

                        room.memory.costMatrix = {costs: costMatrix.serialize(), time: Game.time};
                        return costMatrix;
                    }
                }
            });

            if( result.incomplete ) {
                return CreepBuilder.buildHauler(room);
            } else {
                // Be able to transport 10 energy/tick of movement, round trip :: 20 energy/location on the path
                let numCarry = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME * 2 * result.path.length / CARRY_CAPACITY;
                if( room.energyCapacityAvailable - (numCarry * BODYPART_COST.carry + numCarry * BODYPART_COST.move / 2) > 0 ) {
                    num = numCarry;
                } else {
                    // too big, so just build the biggest one we can
                    num = Math.floor(room.energyCapacityAvailable / (BODYPART_COST.carry + BODYPART_COST.move / 2));
                }
            }
        } else {
            // Only use half the available room energy
            num = Math.floor(room.energyCapacityAvailable / (2 * (BODYPART_COST.carry + BODYPART_COST.move / 2)));
        }

        return helpers.RLD([
            num, CARRY,
            Math.ceil(num / 2), MOVE
        ]);
    }

    static buildFlexWorker(room) {
        // maxEnergy = BODYPART_COST.work * num + BODYPART_COST.carry * (num*2/5) + BODYPART_COST.move * (num*7/5)
        let num = Math.floor(room.energyCapacityAvailable * 5 / (BODYPART_COST.work * 5 + BODYPART_COST.carry * 2 + BODYPART_COST.move * 7));
        let numCarry = Math.max(1, Math.floor(num * 2 / 5));

        return helpers.RLD([
            num, WORK,
            numCarry, CARRY,
            num + numCarry, MOVE
        ]);
    }
}

module.exports = CreepBuilder;