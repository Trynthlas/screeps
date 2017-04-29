'use strict';

let memory = {

    init: function () {
        Object.defineProperty(Structure.prototype, 'memory', {
            configurable: true,
            get: function () {
                if (_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if (!_.isObject(Memory.structures)) {
                    return undefined;
                }

                return Memory.structures[this.id] = Memory.structures[this.id] || {};
            },
            set: function (value) {
                if (_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if (!_.isObject(Memory.structures)) {
                    throw new Error('Could not set source memory');
                }

                Memory.structures[this.id] = value;
            }
        });
    },

    free: function() {
        for(const name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        for(const name in Memory.rooms) {
            if(!Game.rooms[name]) {
                delete Memory.rooms[name];
                console.log('Clearing non-existing room memory:', name);
            }
        }

        for(const id in Memory.structures) {
            if(!Game.structures[id]) {
                delete Memory.structures[id];
                console.log('Clearing non-existing structure memory:', id);
            }
        }
    }
};

module.exports = memory;