"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("@companion-module/base");
const actions_1 = __importDefault(require("./actions"));
const feedbacks_1 = __importDefault(require("./feedbacks"));
const variables_1 = __importDefault(require("./variables"));
const net = __importStar(require("net"));
const avantisconfig_json_1 = __importDefault(require("./avantisconfig.json"));
const PORT = 51325;
const SysExHeader = [0xF0, 0x00, 0x00, 0x1A, 0x50, 0x10, 0x01, 0x00];
const configFields = [
    {
        type: 'static-text',
        id: 'info',
        width: 12,
        value: 'This module is for the Allen & Heath Avantis mixer',
        label: 'Information',
    },
    {
        type: 'textinput',
        id: 'host',
        label: 'Target IP',
        width: 6,
        default: '192.168.1.70',
        regex: base_1.Regex.IP,
    },
    {
        type: 'number',
        label: 'MIDI Base Channel',
        id: 'midiBase',
        tooltip: 'The base channel selected in Utility / Control / MIDI and cannot exceed 12',
        width: 6,
        default: 1,
        min: 1,
        max: 12,
    },
];
class ModuleInstance extends base_1.InstanceBase {
    devMode;
    config;
    tcpSocket;
    scenes;
    tSockets;
    tSocket;
    actionRefreshTimer = null;
    sceneRefreshTimer = null;
    nameRefreshInterval = null;
    isConnected = false;
    heartbeatInterval = null;
    lastRxAt = 0;
    reconnectTimer = null;
    isDestroying = false;
    isConnecting = false;
    init = async (config) => {
        this.config = config;
        this.updateStatus(base_1.InstanceStatus.Ok);
        this.updateActions();
        this.updateFeedbacks();
        this.updateVariableDefinitions();
        this.updateVariables();
        this.devMode = true;
        this.init_tcp();
        this.setupSceneSelection();
    };
    destroy = async () => {
        this.isDestroying = true;
        if (this.nameRefreshInterval) {
            clearInterval(this.nameRefreshInterval);
            this.nameRefreshInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.sceneRefreshTimer) {
            clearTimeout(this.sceneRefreshTimer);
            this.sceneRefreshTimer = null;
        }
        if (this.actionRefreshTimer) {
            clearTimeout(this.actionRefreshTimer);
            this.actionRefreshTimer = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
        if (this.tcpSocket !== undefined) {
            this.tcpSocket.destroy();
        }
        this.log('debug', `destroyed ${this.id}`);
    };
    async configUpdated(config) {
        this.config = config;
        this.init_tcp();
    }
    getConfigFields() {
        return configFields;
    }
    updateActions = () => {
        (0, actions_1.default)(this);
    };
    updateFeedbacks() {
        const feedbacks = (0, feedbacks_1.default)(this);
        this.log('debug', 'getFeedbacks');
        this.log('debug', `feedback keys: ${Object.keys(feedbacks).join(', ')}`);
        this.setFeedbackDefinitions(feedbacks);
    }
    updateVariableDefinitions() {
        (0, variables_1.default)(this);
    }
    config_fields() {
        return [
            {
                type: 'text',
                id: 'info',
                width: 12,
                label: 'Information',
                value: 'This module is for the Allen & Heath Avantis mixer',
            },
            {
                type: 'textinput',
                id: 'host',
                label: 'Target IP',
                width: 6,
                default: '192.168.1.70',
            },
            {
                type: 'number',
                label: 'MIDI Base Channel',
                id: 'midiBase',
                tooltip: 'The base channel selected in Utility / Control / MIDI and cannot exceed 12',
                min: 1,
                max: 12,
                default: 1,
                step: 1,
                required: true,
                range: false,
            },
        ];
    }
    scheduleReconnect(reason = 'retry') {
        if (this.isDestroying)
            return;
        if (this.reconnectTimer)
            return;
        if (this.isConnecting)
            return;
        this.log('debug', `Scheduling reconnect (${reason}) in 5 seconds`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.isDestroying)
                return;
            this.init_tcp();
        }, 5000);
    }
    init_tcp = async () => {
        const self = this;
        this.isDestroying = false;
        if (this.nameRefreshInterval) {
            clearInterval(this.nameRefreshInterval);
            this.nameRefreshInterval = null;
        }
        this.isConnected = false;
        this.lastRxAt = 0;
        this.isConnecting = false;
        if (this.tcpSocket !== undefined) {
            this.tcpSocket.destroy();
            delete this.tcpSocket;
        }
        if (this.config.host) {
            this.isConnecting = true;
            this.tcpSocket = new net.Socket().connect({
                host: this.config.host,
                port: PORT,
            });
            this.tcpSocket.on('status_change', (status, message) => {
                this.updateStatus(status, message);
            });
            this.tcpSocket.on('error', (err) => {
                this.isConnected = false;
                this.isConnecting = false;
                self.log('error', 'TCP error: ' + err.message);
                self.updateStatus(base_1.InstanceStatus.ConnectionFailure);
                self.setVariableValues({
                    connection_state: 'disconnected',
                });
                this.scheduleReconnect('socket error');
            });
            this.tcpSocket.on('connect', () => {
                this.isConnected = true;
                this.isConnecting = false;
                this.lastRxAt = Date.now();
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
                this.tcpSocket.setKeepAlive(true, 10000);
                self.log('debug', `TCP Connected to ${this.config.host}`);
                self.updateStatus(base_1.InstanceStatus.Ok);
                self.setVariableValues({
                    connection_state: 'connected',
                });
                setTimeout(() => {
                    this.refreshAllInputNames('connect');
                }, 10000);
                this.nameRefreshInterval = setInterval(() => {
                    this.refreshAllInputNames('timer');
                }, 10 * 60 * 1000);
                this.heartbeatInterval = setInterval(() => {
                    if (!this.tcpSocket)
                        return;
                    const silenceMs = Date.now() - this.lastRxAt;
                    if (silenceMs > 45000) {
                        this.log('debug', 'No reply from console for 45 seconds, marking disconnected');
                        this.isConnected = false;
                        this.isConnecting = false;
                        self.updateStatus(base_1.InstanceStatus.ConnectionFailure);
                        self.setVariableValues({
                            connection_state: 'disconnected',
                        });
                        try {
                            this.tcpSocket.destroy();
                        }
                        catch (e) { }
                        return;
                    }
                    try {
                        const midiBase = this.config.midiBase - 1;
                        const commands = this.buildGetChannelNameCommand({ channel: '0' }, midiBase);
                        for (const cmd of commands) {
                            this.tcpSocket.write(cmd);
                        }
                    }
                    catch (e) { }
                }, 15000);
            });
            this.tcpSocket.on('close', () => {
                this.isConnected = false;
                this.isConnecting = false;
                if (this.nameRefreshInterval) {
                    clearInterval(this.nameRefreshInterval);
                    this.nameRefreshInterval = null;
                }
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
                self.setVariableValues({
                    connection_state: 'disconnected',
                });
                this.scheduleReconnect('socket close');
            });
            this.tcpSocket.on('data', (data) => {
                this.lastRxAt = Date.now();
                self.validateResponseData(data);
            });
        }
    };
    updateVariables() {
        const values = {
            connection_state: this.isConnected ? 'connected' : 'disconnected',
            last_scene: '',
        };
        for (let i = 1; i <= 64; i++) {
            values[`input_${i}_name`] = '';
            values[`input_${i}_mute`] = '0';
        }
        this.setVariableValues(values);
    }
    validateResponseData(data) {
        if (!data) {
            return;
        }
        try {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            const bytes = Array.from(buffer);
            console.log(`Response DATA: ${JSON.stringify(bytes, null, 2)}`);
            // Scene recall readback:
            // [187, 0, 0, 203, 0] -> Scene 1
            // [187, 0, 0, 203, 1] -> Scene 2
            // [187, 0, 0, 203, 9] -> Scene 10
            if (bytes.length === 5 &&
                bytes[0] === 187 &&
                bytes[1] === 0 &&
                bytes[2] === 0 &&
                bytes[3] === 203) {
                const zeroBasedScene = bytes[4];
                const sceneNumber = zeroBasedScene + 1;
                this.log('debug', `RX scene update scene=${sceneNumber}`);
                this.setVariableValues({
                    last_scene: String(sceneNumber),
                });
                if (this.sceneRefreshTimer) {
                    clearTimeout(this.sceneRefreshTimer);
                }
                this.sceneRefreshTimer = setTimeout(() => {
                    this.refreshAllInputNames('scene');
                }, 500);
                return;
            }
            // Real-time mute readback:
            // [155, channel, 127, 0, 0] = muted
            // [155, channel, 63, 0, 0]  = unmuted
            if (bytes.length >= 5 && bytes[0] === 155) {
                const zeroBasedChannel = bytes[1];
                const value = bytes[2];
                if (value === 127 || value === 63) {
                    const variableChannel = zeroBasedChannel + 1;
                    const muted = value === 127;
                    this.log('debug', `RX mute update channel=${zeroBasedChannel} variableChannel=${variableChannel} muted=${muted}`);
                    this.setVariableValues({
                        [`input_${variableChannel}_mute`]: muted ? '1' : '0',
                    });
                    this.checkFeedbacks('input_mute_state');
                }
            }
            // Parse one or more concatenated SysEx packets in the same TCP frame
            let i = 0;
            while (i < bytes.length) {
                if (bytes[i] !== 0xf0) {
                    i++;
                    continue;
                }
                const end = bytes.indexOf(0xf7, i);
                if (end === -1) {
                    break;
                }
                const packet = bytes.slice(i, end + 1);
                // Channel name reply:
                // F0 00 00 1A 50 10 01 00 0N 02 CH Name... F7
                if (packet.length >= 12 &&
                    packet[0] === 0xf0 &&
                    packet[1] === 0x00 &&
                    packet[2] === 0x00 &&
                    packet[3] === 0x1a &&
                    packet[4] === 0x50 &&
                    packet[5] === 0x10 &&
                    packet[6] === 0x01 &&
                    packet[7] === 0x00 &&
                    packet[9] === 0x02) {
                    const zeroBasedChannel = packet[10];
                    const variableChannel = zeroBasedChannel + 1;
                    const nameBytes = packet.slice(11, packet.length - 1);
                    const decodedName = Buffer.from(nameBytes).toString('ascii').replace(/\0/g, '').trim();
                    this.log('debug', `RX name update channel=${zeroBasedChannel} variableChannel=${variableChannel} name="${decodedName}"`);
                    this.setVariableValues({
                        [`input_${variableChannel}_name`]: decodedName,
                    });
                    this.scheduleActionRefresh();
                }
                i = end + 1;
            }
        }
        catch (e) {
            this.log('error', `validateResponseData error: ${e.message}`);
        }
    }
    setupSceneSelection() {
        this.scenes = [];
        let getSceneBank = (sceneNumber) => {
            if (sceneNumber <= 128) {
                return 0x00;
            }
            if (sceneNumber <= 256) {
                return 0x01;
            }
            if (sceneNumber <= 384) {
                return 0x02;
            }
            return 0x03;
        };
        let getSceneSSNumber = (sceneNumber) => {
            if (sceneNumber > 128) {
                do {
                    sceneNumber -= 128;
                } while (sceneNumber > 128);
            }
            return sceneNumber - 1;
        };
        for (let i = 1; i <= avantisconfig_json_1.default.config.sceneCount; i++) {
            this.scenes.push({
                sceneNumber: i,
                block: getSceneBank(i),
                ss: getSceneSSNumber(i),
            });
        }
    }
    action = async (action) => {
        console.log('action execute:');
        var opt = action.options;
        let bufferCommands = [];
        let midiBase = this.config.midiBase - 1;
        switch (action.action) {
            case 'mute_input': {
                const muteValue = opt.mute === true ||
                    opt.mute === 'true' ||
                    opt.mute === 1 ||
                    opt.mute === '1' ||
                    opt.mute === 'on';
                const variableChannel = parseInt(opt.channel) + 1;
                bufferCommands = this.buildMuteCommand({
                    ...opt,
                    mute: muteValue,
                }, midiBase);
                this.log('debug', `mute_input channel=${opt.channel} variableChannel=${variableChannel} rawMute=${opt.mute} parsedMute=${muteValue}`);
                this.setVariableValues({
                    [`input_${variableChannel}_mute`]: muteValue ? '1' : '0',
                });
                break;
            }
            case 'fader_input':
                bufferCommands = this.buildFaderCommand(opt, midiBase);
                break;
            case 'fader_input_variable': {
                const resolvedLevel = await this.parseVariablesInString(String(opt.level ?? ''));
                opt.level = resolvedLevel;
                bufferCommands = this.buildFaderCommand(opt, midiBase);
                break;
            }
            case 'mute_mono_group':
            case 'mute_stereo_group':
                bufferCommands = this.buildMuteCommand(opt, midiBase + 1);
                break;
            case 'fader_mono_group':
            case 'fader_stereo_group':
                bufferCommands = this.buildFaderCommand(opt, midiBase + 1);
                break;
            case 'mute_mono_aux':
            case 'mute_stereo_aux':
                bufferCommands = this.buildMuteCommand(opt, midiBase + 2);
                break;
            case 'fader_mono_aux':
            case 'fader_stereo_aux':
                bufferCommands = this.buildFaderCommand(opt, midiBase + 2);
                break;
            case 'mute_mono_matrix':
            case 'mute_stereo_matrix':
                bufferCommands = this.buildMuteCommand(opt, midiBase + 3);
                break;
            case 'fader_mono_matrix':
            case 'fader_stereo_matrix':
                bufferCommands = this.buildFaderCommand(opt, midiBase + 3);
                break;
            case 'mute_mono_fx_send':
            case 'mute_stereo_fx_send':
            case 'mute_fx_return':
            case 'mute_dca':
            case 'mute_master':
            case 'mute_group':
                bufferCommands = this.buildMuteCommand(opt, midiBase + 4);
                break;
            case 'fader_DCA':
            case 'fader_mono_fx_send':
            case 'fader_stereo_fx_send':
            case 'fader_fx_return':
            case 'fader_master':
                bufferCommands = this.buildFaderCommand(opt, midiBase + 4);
                break;
            case 'dca_assign':
                bufferCommands = this.buildAssignCommands(opt, midiBase + 4, true);
                break;
            case 'mute_group_assign':
                bufferCommands = this.buildAssignCommands(opt, midiBase + 4, false);
                break;
            case 'scene_recall': {
                const resolvedSceneNumber = await this.parseVariablesInString(String(opt.sceneNumber ?? ''));
                opt.sceneNumber = resolvedSceneNumber;
                bufferCommands = this.buildSceneCommand(opt, midiBase);
                this.setVariableValues({
                    last_scene: String(parseInt(resolvedSceneNumber) + 1),
                });
                break;
            }
            case 'scene_recall_variable': {
                const resolvedSceneNumber = await this.parseVariablesInString(String(opt.sceneNumber ?? ''));
                opt.sceneNumber = String(parseInt(resolvedSceneNumber) - 1);
                bufferCommands = this.buildSceneCommand(opt, midiBase);
                this.setVariableValues({
                    last_scene: String(parseInt(resolvedSceneNumber)),
                });
                break;
            }
            case 'channel_main_assign':
                bufferCommands = this.buildChannelAssignCommand(opt, midiBase);
                break;
            case 'channel_name': {
                const resolvedChannelName = await this.parseVariablesInString(String(opt.channelName ?? ''));
                opt.channelName = resolvedChannelName;
                bufferCommands = this.buildChannelNameCommand(opt, midiBase);
                const variableChannel = parseInt(opt.channel) + 1;
                this.setVariableValues({
                    [`input_${variableChannel}_name`]: resolvedChannelName,
                });
                this.scheduleActionRefresh();
                break;
            }
            case 'get_input_name':
                bufferCommands = this.buildGetChannelNameCommand(opt, midiBase);
                break;
            case 'refresh_all_input_names': {
                this.refreshAllInputNames('button');
                bufferCommands = [];
                break;
            }
            case 'channel_color':
                bufferCommands = this.buildChannelColorCommand(opt, midiBase);
                break;
            case 'send_input_to_mono_aux':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 2);
                break;
            case 'send_input_to_mono_aux_number':
                bufferCommands = this.buildSendLevelNumberCommand(opt, midiBase, 0, 2);
                break;
            case 'send_input_to_stereo_aux':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 2);
                break;
            case 'send_input_to_mono_matrix':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 3);
                break;
            case 'send_input_to_stereo_matrix':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 3);
                break;
            case 'send_input_to_fx_return':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 4);
                break;
            case 'send_input_to_mono_fx_return':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 4);
                break;
            case 'send_input_to_stereo_fx_return':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 4);
                break;
            case 'send_input_to':
                bufferCommands = this.buildSendLevelCommand(opt, midiBase, 0, 4);
                break;
        }
        console.log(bufferCommands);
        for (let i = 0; i < bufferCommands.length; i++) {
            setTimeout(() => {
                if (this.tcpSocket) {
                    this.dumpData(opt, midiBase, [bufferCommands[i]]);
                    this.log('debug', `sending '${bufferCommands[i].toString('hex')}' ${i}/${bufferCommands.length} via TCP @${this.config.host}`);
                    this.tcpSocket.write(bufferCommands[i]);
                }
            }, i * 20);
        }
    };
    scheduleActionRefresh() {
        if (this.actionRefreshTimer) {
            clearTimeout(this.actionRefreshTimer);
        }
        this.actionRefreshTimer = setTimeout(() => {
            this.log('debug', 'Refreshing action definitions for named input dropdowns');
            this.updateActions();
        }, 300);
    }
    refreshAllInputNames(reason = 'manual') {
        try {
            if (!this.tcpSocket)
                return;
            this.log('debug', `Refreshing all input names (${reason})`);
            const midiBase = this.config.midiBase - 1;
            // Slightly slower pacing than before to improve reliability across all inputs
            for (let ch = 0; ch < 64; ch++) {
                setTimeout(() => {
                    if (this.tcpSocket) {
                        const commands = this.buildGetChannelNameCommand({ channel: String(ch) }, midiBase);
                        for (const cmd of commands) {
                            this.log('debug', `Sending input name request for channel ${ch}`);
                            this.tcpSocket.write(cmd);
                        }
                    }
                }, ch * 50);
            }
        }
        catch (e) {
            this.log('error', `refreshAllInputNames error: ${e.message}`);
        }
    }
    buildMuteCommand(opt, midiOffset) {
        return [
            Buffer.from([0x90 + midiOffset, opt.channel, opt.mute ? 0x7f : 0x3f, 0x90 + midiOffset, opt.channel, 0x00]),
        ];
    }
    buildFaderCommand(opt, midiOffset) {
        let faderLevel = parseInt(opt.level);
        return [
            Buffer.from([
                0xb0 + midiOffset,
                0x63,
                opt.channel,
                0xb0 + midiOffset,
                0x62,
                0x17,
                0xb0 + midiOffset,
                0x06,
                faderLevel,
            ]),
        ];
    }
    buildAssignCommands(opt, midiOffset, isDca) {
        let routingCmds = [];
        let groups = isDca ? opt.dcaGroup : opt.muteGroup;
        let offset = 0;
        if (isDca) {
            if (opt.assign) {
                offset = 0x40;
            }
        }
        else {
            if (opt.assign) {
                offset = 0x50;
            }
            else {
                offset = 0x10;
            }
        }
        for (let i = 0; i < groups.length; i++) {
            let grpCode = groups[i];
            routingCmds.push(Buffer.from([
                0xb0 + midiOffset,
                0x63,
                opt.channel,
                0xb0 + midiOffset,
                0x62,
                0x40,
                0xb0 + midiOffset,
                0x06,
                grpCode + offset,
            ]));
        }
        return routingCmds;
    }
    buildSceneCommand(opt, midiOffset) {
        const sceneNumber = parseInt(opt.sceneNumber);
        const scene = this.scenes.find((s) => s.sceneNumber === sceneNumber);
        if (!scene) {
            return [];
        }
        return [Buffer.from([0xc0 + midiOffset, scene.block, scene.ss])];
    }
    buildChannelAssignCommand(opt, midiOffset) {
        let assignCmds = [];
        let mixes = opt.mainMix;
        let offset = opt.assign ? 0x40 : 0x00;
        for (let i = 0; i < mixes.length; i++) {
            let mixCode = mixes[i];
            assignCmds.push(Buffer.from([
                0xb0 + midiOffset,
                0x63,
                opt.channel,
                0xb0 + midiOffset,
                0x62,
                0x40,
                0xb0 + midiOffset,
                0x06,
                mixCode + offset,
            ]));
        }
        return assignCmds;
    }
    buildChannelNameCommand(opt, midiOffset) {
        const commandArray = [...SysExHeader, 0x00 + midiOffset, 0x03, parseInt(opt.channel)];
        for (let i = 0; i < opt.channelName.length; i++) {
            const char = opt.channelName[i];
            // @ts-ignore
            const value = avantisconfig_json_1.default.name[char];
            if (value) {
                commandArray.push(parseInt(value, 16));
            }
        }
        commandArray.push(0xf7);
        return [Buffer.from(commandArray)];
    }
    buildGetChannelNameCommand(opt, midiOffset) {
        return [Buffer.from([...SysExHeader, 0x00 + midiOffset, 0x01, parseInt(opt.channel), 0xf7])];
    }
    buildChannelColorCommand(opt, midiOffset) {
        return [Buffer.from([...SysExHeader, 0x00 + midiOffset, 0x06, parseInt(opt.channel), parseInt(opt.color), 0xf7])];
    }
    buildSendLevelCommand(opt, baseMidi, srcMidiChnl, destMidiChnl) {
        return [
            Buffer.from([
                ...SysExHeader,
                0x00 + baseMidi + srcMidiChnl,
                0x0d,
                parseInt(opt.srcChannel),
                baseMidi + destMidiChnl,
                opt.destChannel,
                parseInt(opt.level),
                0xf7,
            ]),
        ];
    }
    buildSendLevelNumberCommand(opt, baseMidi, srcMidiChnl, destMidiChnl) {
        return [
            Buffer.from([
                ...SysExHeader,
                0x00 + baseMidi + srcMidiChnl,
                0x0d,
                parseInt(opt.srcChannel),
                baseMidi + destMidiChnl,
                opt.destChannel,
                parseInt(String(opt.level)),
                0xf7,
            ]),
        ];
    }
    dumpData(opt, midiBase, bufferCommands) {
        console.log(bufferCommands);
        console.log('dumpData:', JSON.stringify(opt, null, 2), midiBase);
    }
}
// @ts-ignore
(0, base_1.runEntrypoint)(ModuleInstance, [], configFields);
//# sourceMappingURL=main.js.map