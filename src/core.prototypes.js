'use strict';

// -----------------------------------------------------------------------------------------------------
// Creep
// -----------------------------------------------------------------------------------------------------

Object.defineProperties(Creep.prototype, {
    'amount': {
        get:          function() {
            if( !this._amount ) {
                this._amount = _.sum(this.carry);
            }
            return this._amount;
        },
        configurable: true
    }
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

Object.defineProperties(Room.prototype, {
    'sources':    {
        get:          function() {
            if( !this._sources ) {
                if( !this.memory.sources ) {
                    this.memory.sources = this.find(FIND_SOURCES).map(src => src.id);
                }
                this._sources = this.memory.sources.map(id => Game.getObjectById(id));
            }
            return this._sources;
        },
        configurable: true
    },
    'minerals':   {
        get:          function() {
            if( !this._minerals ) {
                if( !this.memory.minerals ) {
                    this.memory.minerals = this.find(FIND_MINERALS).map(min => min.id);
                }
                this._minerals = this.memory.minerals.map(id => Game.getObjectById(id));
            }
            return this._minerals;
        },
        configurable: true
    },
    'exits':      {
        get:          function() {
            if( !this.memory.exits ) {
                this.memory.exits = Game.map.describeExits(this.name);
            }
            return this.memory.exits;
        },
        set:          function(exits) {
            this.memory.exits = exits;
        },
        configurable: true
    },
    'extensions': {
        get:          function() {
            if( !this._extensions ) {
                if( !this.memory.extensions ) {
                    this.memory.extensions = this.find(FIND_MY_STRUCTURES,
                                                       { filter: s => s.structureType === STRUCTURE_EXTENSION })
                        .map(s => s.id);
                }
                this._extensions = this.memory.extensions.map(id => Game.getObjectById(id));
            }
            return this._extensions;
        },
        set:          function(extensions) {
            if( extensions ) {
                this.memory.extensions = extensions.map(t => t.id);
                this._extensions = extensions;
            } else {
                this.memory.extensions.length = 0;
                this._extensions = undefined;
            }
        },
        configurable: true
    },
    'spawns':     {
        get:          function() {
            if( !this._spawns ) {
                if( !this.memory.spawns ) {
                    this.memory.spawns = this.find(FIND_MY_STRUCTURES,
                                                   { filter: s => s.structureType === STRUCTURE_SPAWN }).map(s => s.name);
                }
                this._spawns = this.memory.spawns.map(name => Game.spawns[name]);
            }
            return this._spawns;
        },
        set:          function(spawns) {
            if( spawns ) {
                this.memory.spawns = spawns.map(s => s.name);
                this._spawns = spawns;
            } else {
                this.memory.spawns.length = 0;
                this._spawns = undefined;
            }
        },
        configurable: true
    },
    'towers':     {
        get:          function() {
            if( !this._towers ) {
                if( !this.memory.towers ) {
                    this.memory.towers = this.find(FIND_MY_STRUCTURES,
                                                   { filter: s => s.structureType === STRUCTURE_TOWER }).map(s => s.id);
                }
                this._towers = this.memory.towers.map(id => Game.getObjectById(id));
            }
            return this._towers;
        },
        set:          function(towers) {
            if( towers ) {
                this.memory.towers = towers.map(t => t.id);
                this._towers = towers;
            } else {
                this.memory.towers.length = 0;
                this._towers = undefined;
            }
        },
        configurable: true
    }
});

Room.prototype.getStructuresByType = function(structureType) {
    switch( structureType ) {
    case STRUCTURE_SPAWN:
        return this.spawns;
    case STRUCTURE_EXTENSION:
        return this.extensions;
    case STRUCTURE_TOWER:
        return this.towers;
    case STRUCTURE_STORAGE:
        return this.storage;
    case STRUCTURE_TERMINAL:
        return this.terminal;
    default:
        return this.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === structureType });
    }
};


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

// -----------------------------------------------------------------------------------------------------
// StructureTerminal
// -----------------------------------------------------------------------------------------------------

Object.defineProperty(StructureTerminal.prototype, 'amount', {
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