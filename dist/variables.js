"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(self) {
    const variables = [
        { variableId: 'connection_state', name: 'Connection State' },
        { variableId: 'last_scene', name: 'Last Scene' },
    ];
    for (let i = 1; i <= 64; i++) {
        variables.push({
            variableId: `input_${i}_name`,
            name: `Input ${i} Name`,
        });
        variables.push({
            variableId: `input_${i}_mute`,
            name: `Input ${i} Mute`,
        });
    }
    self.setVariableDefinitions(variables);
}
//# sourceMappingURL=variables.js.map