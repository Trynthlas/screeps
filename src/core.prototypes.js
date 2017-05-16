'use strict';

// -----------------------------------------------------------------------------------------------------
// Creep
// -----------------------------------------------------------------------------------------------------

Object.defineProperty(Creep.prototype, 'amount', {
    get:          function() {
        if( !this._amount ) {
            this._amount = _.sum(this.carry);
        }
        return this._amount;
    },
    configurable: true
});

/**
 * Transfers the next valid resource with amount > 0 on the creep to the target.
 * @param target
 */
Creep.prototype.transferTo = function(target) {
    if( target instanceof StructureExtension || target instanceof Spawn || target instanceof StructureLink || target instanceof StructureTower ) {
        return this.transfer(target, RESOURCE_ENERGY);
    } else {
        let res = _.pick(this.carry, _.identity);

        console.log(this.name, 'transferring resource', Object.keys(res)[0], 'with amount', this.carry[Object.keys(res)[0]]);
        return this.transfer(target, Object.keys(res)[0]);
    }
};

/**
 * Looks for any free energy on the ground and has the creep pickup() to the carry capacity
 */
Creep.prototype.pickupNearbyEnergy = function() {
    let carried = _.sum(this.carry);
    if( carried < this.carryCapacity ) {
        let freeEnergy = this.pos.findInRange(FIND_DROPPED_ENERGY, 1);
        if( freeEnergy.length ) {
            for( const e of freeEnergy ) {
                if( this.pickup(e) === OK ) {
                    carried += e.amount;
                    if( carried >= this.carryCapacity ) {
                        break;
                    }
                }
            }
        }
    }
};

/**
 * Performs repairs to anything at the same location as the creep
 *
 * @param {Structure} [target] will repair this target before looking for others
 */
Creep.prototype.doLocalRepairs = function(target) {
    if( target && target.hits < target.hitsMax ) {
        this.repair(target);
    } else {
        let structures = _.filter(this.pos.lookFor(LOOK_STRUCTURES), (s) => {
            return s.hits < s.hitsMax;
        });
        if( structures.length ) {
            this.repair(structures[0]);
        }
    }
};


// -----------------------------------------------------------------------------------------------------
// Room
// -----------------------------------------------------------------------------------------------------


// -----------------------------------------------------------------------------------------------------
// StructureContainer
// -----------------------------------------------------------------------------------------------------

Object.defineProperty(StructureContainer.prototype, 'amount', {
    get:          function() {
        if( !this._amount ) {
            this._amount = _.sum(this.store);
        }
        return this._amount;
    },
    set:          function(val) {
        this._amount = val;
    },
    configurable: true
});

// -----------------------------------------------------------------------------------------------------
// StructureStorage
// -----------------------------------------------------------------------------------------------------

Object.defineProperty(StructureStorage.prototype, 'amount', {
    get:          function() {
        if( !this._amount ) {
            this._amount = _.sum(this.store);
        }
        return this._amount;
    },
    set:          function(val) {
        this._amount = val;
    },
    configurable: true
});