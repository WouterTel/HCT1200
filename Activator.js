const path = require('path');
const PluginActivator = require('rodix_api').PluginActivator;
const HCT_1200ExtensionService = require(path.join(__dirname, 'HCT_1200ExtensionNodeService'));
const HCT_1200ProgramNodeService = require(path.join(__dirname, 'HCT_1200ProgramNodeService'));

class Activator extends PluginActivator {
    constructor() {
        super();
    }

    start(context) {
        context.registerService('HCT_1200Extension', new HCT_1200ExtensionService());
        context.registerService('HCT_1200ProgramNodeService', new HCT_1200ProgramNodeService());
    }

    stop() {
    }
}

module.exports = Activator;
