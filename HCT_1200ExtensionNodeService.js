const path = require('path');
const ExtensionNodeService = require('rodix_api').ExtensionNodeService;
const HCT_1200ExtensionNodeContribution = require(path.join(__dirname, 'HCT_1200ExtensionNodeContribution'));

class HCT_1200ExtensionNodeService extends ExtensionNodeService{
    constructor(){
        super();
    }

    getTitle(){
        return 'HCT-1200';
    }
    getHTML(){
        return path.join(__dirname, "htmlStore/HCT_1200ExtensionNode.html");
    }
    createContribution(rodiAPI, dataModel){
        return new HCT_1200ExtensionNodeContribution(rodiAPI, dataModel);
    }
}

module.exports = HCT_1200ExtensionNodeService;
