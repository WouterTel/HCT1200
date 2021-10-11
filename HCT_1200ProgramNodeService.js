const path = require('path');
const ProgramNodeService = require('rodix_api').ProgramNodeService;
const HCT_1200ProgramNodeContribution = require(path.join(__dirname, 'HCT_1200ProgramNodeContribution'));

class HCT_1200ProgramNodeService extends ProgramNodeService{
    constructor(){
        super();
    }

    getIcon() {
        return path.join(__dirname, "htmlStore/resource/ico-hct.png");
    }

    getTitle(){
        return 'HCT-1200';
    }

    getHTML(){
        return path.join(__dirname, "htmlStore/HCT_1200ProgramNode.html");
    }

    isDeprecated(){
        return false;
    }

    isChildrenAllowed(){
        return false;
    }
    isThreadAllowed(){
        return false;
    }

    createContribution(rodiAPI, dataModel){
        return new HCT_1200ProgramNodeContribution(rodiAPI, dataModel);
    }

}

module.exports = HCT_1200ProgramNodeService;
