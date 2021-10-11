const ProgramNodeContribution = require('rodix_api').ProgramNodeContribution;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Bugs to be fixed/Additions to be done:

    - Automatically change TCP when the robot picks up a product
    - Option to move to product location from program node
    
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class HCT_1200ProgramNodeContribution extends ProgramNodeContribution {
    constructor(rodiAPI, dataModel){
        super();
        this.rodiAPI = rodiAPI;
        this.dataModel = dataModel;
        this.uiHandler = rodiAPI.getUIHandler();
        this.components = this.uiHandler.getAllUIComponents();
        this.variableModel = this.rodiAPI.getVariableModel()
	    this.tcpModel = this.rodiAPI.getTcpModel();
	    this.console = this.rodiAPI.getUserInteraction().Console;

	    //let payLoad = this.tcpModel.getTcpList();
	    //this.console.log(`${JSON.stringify(payLoad)}`);

	    // Defining extensions
        this.extension = rodiAPI.getExtensionContribution('HCT_1200ExtensionNodeContribution');
        this.extensionRobotiq = this.rodiAPI.getExtensionContribution('gripperExtensionNodeContribution');

	    // Defining selection boxes in program screen
        this.selGrid = this.components.selGrid;
        this.selProduct = this.components.selProduct;
        this.selGripper = this.components.selGripper;
        this.selCounterVar = this.components.selCounterVar;
        this.selStackType = this.components.selStackType;

	    // Defining input boxes in program screen
        this.inpSpeed = this.components.inpSpeed;
        this.inpAcc = this.components.inpAcc;
        this.inpRadius = this.components.inpRadius;

	    // Defining checkbox in program screen
        this.CbBlending = this.components.CbBlending;

	    // Defining functions to be called when an element is changed
	    this.uiHandler.on('selGrid', this.onSelGrid.bind(this));
	    this.uiHandler.on('selGripper', this.onSelGripper.bind(this));
	    this.uiHandler.on('selProduct', this.onSelProduct.bind(this));
	    this.uiHandler.on('selStackType', this.onSelStackType.bind(this));
        this.uiHandler.on('CbBlending', this.onCbBlending.bind(this));
	    this.uiHandler.on('inpSpeed', this.onInpSpeed.bind(this));
        this.uiHandler.on('inpAcc', this.onInpAcc.bind(this));
        this.uiHandler.on('selCounterVar', this.onSelCounterVar.bind(this));
        this.uiHandler.on('inpRadius',this.onInpRadius.bind(this));

        this.selStackTypeContent = ["Pick", "Place"];

	    // Update input boxes to contain all options entered in the extension page
        this.updateBoxes();

    }
    initializeNode(thisNode, callback) {
        callback(null, thisNode);
    }
    openView(){
	    // Update input boxes to contain all options entered in the extension page
        this.updateBoxes();

        this.uiHandler.render();
    }
    closeView(){

    }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Generate script
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    generateScript(enterWriter, exitWriter){

        // Retrieving chosen variables from data model
        const{
            selectedGrid,
            selectedGripper,
            selectedProduct,
            selectedStackType,
            selectedSpeed,
            selectedAcc,
            selectedCounter,
            blendingSelect,
            blendingRadius
        } = this.getVariables();

        const {
            gridSettingList,
            gripperSettingList,
            productSettingList
        } = this.getLists();


        // If the selected counter variable is not zero the user can choose to reset it
        let counterVar = this.variableModel.get(selectedCounter);
        if(counterVar.getValue() != 0){
            this.rodiAPI.getUserInteraction().MessageBox.show('INFO','Counter variable is not zero. Would you like to reset the counter variable to zero?','INFO','YesNo',value =>{
                if(value == 'Yes'){this.variableModel.setGlobalVariable(selectedCounter,0);}
            });
        }

	    // Defining variables
        let productSettings = [];
        let gripperSettings = [];

        //let radius = this.inpRadius.getText();

        let robotiq_gripper_id = 0;

        // Create grid position coordinates
        const{gridPositionArrayX, gridPositionArrayY, gridPositionArrayZ} = this.extension.createGridCoordinates(selectedGrid,selectedProduct);       
	
	    // If Place is selected the arrays are inverted
        if(selectedStackType === "Place") {
            gridPositionArrayX.reverse();
            gridPositionArrayY.reverse();
            gridPositionArrayZ.reverse();
        }

        //this.console.log(`${gridPositionArrayX[0]}, ${gridPositionArrayY[0]}, ${gridPositionArrayZ[0]}`);
        
        

	    // Defining gripper settings
        gripperSettingList.forEach(value => {
            if(selectedGripper === value.name) {
                gripperSettings = value.data; 
            }
        });

	    // Defining product settings
        productSettingList.forEach(value => {
            if(selectedProduct === value.name) {
                productSettings = value.data;
            }
        });
        // Orientations to pick up products
        let orientations = [productSettings[4], productSettings[5], productSettings[6], productSettings[7], productSettings[8], productSettings[9]];
        let zDelta = 50; // zDelta is used to create a pose near the product. The robot will first move to this pose, before picking the product.

        
	    // If Robotiq gripper is selected it is checked whether the robotiq plug-in is installed and the gripper is activated
        if(gripperSettings[0] === "Robotiq Hand-E" || gripperSettings[0] === "Robotiq 2F-85/140"|| gripperSettings[0] === "Robotiq AirPick") {
            if(this.extensionRobotiq === undefined) {
                this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Robotiq gripper plugin has been removed! Please reïnstall plugin or change gripper settings.', 'ERROR', 'OK');
                return;
            } else {
                robotiq_gripper_id = ("Robotiq_Gripper_id", this.extensionRobotiq.getGripperId());
                if(robotiq_gripper_id === undefined){
                    this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Robotiq gripper has not been activated! Please activate the Robotiq gripper in the plugin screen.', 'ERROR', 'OK');
                    return;
                } 
            }
        }

        // Speed variables, the pick speed is set at 20 percent of the normal movement speed
        let speedApproach = selectedSpeed;
        let accelerationApproach = selectedAcc;
        let speedPick = 0.2 * speedApproach;
        let accelerationPick = 0.2 * accelerationApproach;

        // Products that should be picked in a different position are put in an array
        let posDifferentOrientationArray = [];
        productSettings[10].forEach(value => {
            posDifferentOrientationArray.push(Number(value));
        });

        //
        enterWriter.appendLine(`if(${this.selCounterVar.getSelectedItem()} >= (${gridPositionArrayX.length})) {
                                    ${this.selCounterVar.getSelectedItem()} = 0;
                                    halt();
                                } else {
                                    ${this.selCounterVar.getSelectedItem()} += 1;
                                }`);
        
        //
        enterWriter.appendLine(`let productCounter = ${this.selCounterVar.getSelectedItem()} - 1`);

        // Enter position arrays to script
        enterWriter.appendLine(`let xCoordinatesArray = [${gridPositionArrayX}];`);
        enterWriter.appendLine(`let yCoordinatesArray = [${gridPositionArrayY}];`);
        enterWriter.appendLine(`let zCoordinatesArray = [${gridPositionArrayZ}];`);

        // Enter position orientation array to script
        enterWriter.appendLine(`let difOrientArray = [${posDifferentOrientationArray}];`);

        // Keeping count of current product
        enterWriter.appendLine(`let xCurrent = xCoordinatesArray[productCounter];`);
        enterWriter.appendLine(`let yCurrent = yCoordinatesArray[productCounter];`);
        enterWriter.appendLine(`let zCurrent = zCoordinatesArray[productCounter];`);
/*
        // Keeping count of current product
        enterWriter.appendLine(`let xCurrent = xCoordinatesArray[${this.selCounterVar.getSelectedItem()}];`);
        enterWriter.appendLine(`let yCurrent = yCoordinatesArray[${this.selCounterVar.getSelectedItem()}];`);
        enterWriter.appendLine(`let zCurrent = zCoordinatesArray[${this.selCounterVar.getSelectedItem()}];`);
*/
        // Defining pick orientations
        enterWriter.appendLine(`let rX = 0;`);
        enterWriter.appendLine(`let rY = 0;`);
        enterWriter.appendLine(`let rZ = 0;`);
        enterWriter.appendLine(`let currentOrientX = 0;`);
        enterWriter.appendLine(`let currentOrientY = 0;`);
        enterWriter.appendLine(`let currentOrientZ = 0;`);

        // Position orientation is set
        enterWriter.appendLine(`if(difOrientArray.includes(productCounter)) {
                                    rX = ${orientations[3]};
                                    rY = ${orientations[4]};
                                    rZ = ${orientations[5]};
                                    currentOrientZ = Math.round(getCurrentPose('tcp').rz);
                                    currentOrientY = Math.round(getCurrentPose('tcp').ry);
                                    currentOrientX = Math.round(getCurrentPose('tcp').rx);
                                    if(currentOrientZ === -0) {
                                        currentOrientZ = 0;
                                    } else if(currentOrientY === -0) {
                                        currentOrientY = 0;
                                    } else if(currentOrientX === -0) {
                                        currentOrientX = 0;
                                    }
                                    if(rZ !== currentOrientZ || rX !== currentOrientX || rY !== currentOrientY){
                                        let currentPose = getCurrentPose('tcp');
                                        moveJoint(convertPoseToJoint('tcp', createPose(currentPose.x, currentPose.y, currentPose.z, rX, rY, rZ), getCurrentJoint()), 80, 160);
                                    }
                                } else {
                                    rZ = ${orientations[2]};
                                    rY = ${orientations[1]};
                                    rX = ${orientations[0]};
                                    currentOrientZ = Math.round(getCurrentPose('tcp').rz);
                                    currentOrientY = Math.round(getCurrentPose('tcp').ry);
                                    currentOrientX = Math.round(getCurrentPose('tcp').rx);
                                    if(currentOrientZ === -0) {
                                        currentOrientZ = 0;
                                    } else if(currentOrientY === -0) {
                                        currentOrientY = 0;
                                    } else if(currentOrientX === -0) {
                                        currentOrientX = 0;
                                    }
                                    if(rZ !== currentOrientZ || rX !== currentOrientX || rY !== currentOrientY){
                                        let currentPose = getCurrentPose('tcp');
                                        moveJoint(convertPoseToJoint('tcp', createPose(currentPose.x, currentPose.y, currentPose.z, rX, rY, rZ), getCurrentJoint()), 80, 160);
                                    }
                                }`);

        enterWriter.appendLine(`let rotation = [rX, rY, rZ];`);

        // Define position before picking
        enterWriter.appendLine(`let posRelative = createPose(0, 0, -${zDelta}, 0, 0, 0);`);
        enterWriter.appendLine(`let posTarget = createPose(xCurrent, yCurrent, zCurrent, rotation[0], rotation[1], rotation[2]);`);
        enterWriter.appendLine(`let posAbove = poseTrans(posTarget, posRelative);`);

        if(blendingSelect) {
            enterWriter.appendLine(`moveLinear('tcp', posAbove, ${speedApproach}, ${accelerationApproach}, {"precisely":false, "radius":${blendingRadius}}, function() {});`);
        } else {
            // Move towards position above picking position
            enterWriter.appendLine(`moveLinear('tcp', posAbove, ${speedApproach}, ${accelerationApproach}, {"precisely":true}, function() {});`);
        }
        // enterWriter.appendLine(`console.log(posTarget)`);
        // Move towards picking position
        enterWriter.appendLine(`moveLinear('tcp', posTarget, ${speedPick}, ${accelerationPick}, {"precisely":true}, function() {});`);
        enterWriter.appendLine(`wait(200);`);


	// Add gripper close/open argument
        if(gripperSettings[0] === "Schunk Co-act" || gripperSettings[0] === "IO-based gripper") {
            if(gripperSettings[4] === "Open") {
                if(gripperSettings[1] === "Controller") {
                    enterWriter.appendLine(`setGeneralDigitalOutput(${gripperSettings[3]}, 0);`);
                    enterWriter.appendLine(`setGeneralDigitalOutput(${gripperSettings[2]}, 1);`);
                } else if(gripperSettings[1] === "Tool"){
                    enterWriter.appendLine(`setToolDigitalOutput(${gripperSettings[3]}, 0);`);
                    enterWriter.appendLine(`setToolDigitalOutput(${gripperSettings[2]}, 1);`);
                }
            } else if(gripperSettings[4] === "Close"){
                if(gripperSettings[1] === "Controller") {
                    enterWriter.appendLine(`setGeneralDigitalOutput(${gripperSettings[2]}, 0);`);
                    enterWriter.appendLine(`setGeneralDigitalOutput(${gripperSettings[3]}, 1);`);
                } else if(gripperSettings[1] === "Tool"){
                    enterWriter.appendLine(`setToolDigitalOutput(${gripperSettings[2]}, 0);`);
                    enterWriter.appendLine(`setToolDigitalOutput(${gripperSettings[3]}, 1);`);
                }
            }
        } else if (gripperSettings[0] === "OnRobot RG-6") {
            enterWriter.appendLine(`let dev1 = onrobotXmlrpcClient.cb_is_device_connected(0, 32);`);
            enterWriter.appendLine(`let dev2 = onrobotXmlrpcClient.cb_is_device_connected(0, 33);`);
            enterWriter.appendLine(`if (!dev1 && !dev2){
                                        popup("OnRobot: RGx device not connected, Program halted!");
                                        console.log("OnRobot: RGx device not connected, Program halted!");
                                        halt();
                                    }`);
            enterWriter.appendLine(`onrobotXmlrpcClient.rg_grip(0, (${gripperSettings[1]} + 0.00001), (${gripperSettings[2]} + 0.00001));`); //(gripper_no, width, force)
            enterWriter.appendLine(`let busy = onrobotXmlrpcClient.rg_get_busy(0);`);
            enterWriter.appendLine(`do {
                                        sleep(100)
                                        busy = onrobotXmlrpcClient.rg_get_busy(0);
                                    } while (busy == true);`);
        } else if (gripperSettings[0] === "Robotiq 2F-85/140" || gripperSettings[0] === "Robotiq Hand-E") {
            enterWriter.appendLine(`rq_move_and_wait(${Math.round((Number(gripperSettings[1]) / 100) * 255)}, ${Math.round((Number(gripperSettings[2]) / 100) * 255)}, ${Math.round((Number(gripperSettings[3]) / 100) * 255)}, ${robotiq_gripper_id});`);
        } else if (gripperSettings[0] === "Robotiq AirPick"){
            if (gripperSettings[1] == 'Pick'){
                enterWriter.appendLine(`rq_move_and_wait(8,255,255,${robotiq_gripper_id})`);
            } else if (gripperSettings[1] == 'Drop'){
                enterWriter.appendLine(`rq_move_and_wait(255,255,255,${robotiq_gripper_id})`);
            }
            
        }


        enterWriter.appendLine(`let currentPayload = getPayload();`);
        enterWriter.appendLine(`let currentTCP = getToolCenterPoint();`);
        enterWriter.appendLine(`let targetPayload = 0;`);
        enterWriter.appendLine(`if(currentPayload === emptPload) {
                                    targetPayload = emptPload + ${productSettings[3]};
                                    //currentTCP.z = currentTCP.z + ${productSettings[2]};
                                } else if (currentPayload > emptPload) {
                                    targetPayload = currentPayload - ${productSettings[3]};
                                    //currentTCP.z = currentTCP.z - ${productSettings[2]};
                                } else {
                                    popup("Current set payload value is smaller than given empty payload value, program is stopped!");
                                    console.log("Current set payload value is smaller than given empty payload value, program is stopped!");
                                    halt();
                                }`);

        enterWriter.appendLine(`setPayload(targetPayload);`);



        enterWriter.appendLine(`wait(200);`);
        enterWriter.appendLine(`moveLinear('tcp', posAbove, ${speedPick}, ${accelerationPick});`);
/*        
        enterWriter.appendLine(`if(${this.selCounterVar.getSelectedItem()} >= (xCoordinatesArray.length - 1)) {
                                    ${this.selCounterVar.getSelectedItem()} = 0;
                                } else {
                                    ${this.selCounterVar.getSelectedItem()} += 1;
                                }`);
                                */

    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Is defined function
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // This function checks if all necessary boxes have been filled, otherwise the program can not be applied
    isDefined(){
        let check = true;

        let variables = ['selectedGrid', 'selectedGripper', 'selectedProduct', 'selectedStackType', 'selectedSpeed', 'selectedAcc', 'selectedCounter'];

        variables.forEach(entry => {
            if(this.dataModel.has(entry) === false){
                check = false;
                this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please fill in all necessary options', 'ERROR', 'OK');
            }
        })
        return check;
    }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	General functions
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Function called when the blending checkbox is selected
    // !!!! Moet nog naar gekeken worden !!!!
    onCbBlending(type, data) {
        if(type === "checked") {
            if(data.checked) {
		        this.dataModel.set('blendingSelect', true);
                this.inpRadius.setDisabled(false);
            } else {
		        this.dataModel.set('blendingSelect', false);
                this.inpRadius.setDisabled(true);
            }
            
        }
    }
 
    // Functions called whenever an input or selectbox value is changed
   
    onSelGrid(type, data){
	    if(type !== 'select') return;
	    this.dataModel.set('selectedGrid', data.selected);
    }

    onSelGripper(type, data){
	    if(type !== 'select') return;
	    this.dataModel.set('selectedGripper', data.selected);
    }

    onSelProduct(type, data){
	    if(type !== 'select') return;
	    this.dataModel.set('selectedProduct', data.selected);
    }
    
    onSelStackType(type, data){
	    if(type !== 'select') return;
	    this.dataModel.set('selectedStackType', data.selected);
    }

    onInpSpeed(type, data){
	    if(type !== 'change') return;
	    this.dataModel.set('selectedSpeed', data.value);
    }

    onInpAcc(type, data){
	    if(type !== 'change') return;
	    this.dataModel.set('selectedAcc', data.value);
    }

    onSelCounterVar(type, data){
        if(type !== 'select') return;
        this.dataModel.set('selectedCounter',data.selected);
    }

    onInpRadius(type, data){
        if(type !== 'change') return;
        this.dataModel.set('blendingRadius', data.value);
    }

    // Function for when the program tab is opened. Select boxes are updated to contain all options defined in the extension page
    updateBoxes(){
        const {
            gridSettingList,
            gripperSettingList,
            productSettingList
        } = this.getLists();

	    // Update grid settings select box
	    this.selGrid.removeAllItems();
	    gridSettingList.forEach(value => {
            this.selGrid.addItem(value.name, value.name);
        });

	    // Update gripper settings select box
	    this.selGripper.removeAllItems();
        gripperSettingList.forEach(value => {
            this.selGripper.addItem(value.name, value.name);
        });

	    // Update product settings select box
	    this.selProduct.removeAllItems();
        productSettingList.forEach(value => {
            this.selProduct.addItem(value.name, value.name);
        });

	    // Update stack/unstack select box
	    this.selStackType.removeAllItems();
        this.selStackTypeContent.forEach(value => {
            this.selStackType.addItem(value, value);
        });

        // Update counter variable select box
        this.selCounterVar.removeAllItems();
        let variables = this.variableModel.getAll();
        variables.forEach(value => {
            if(value.getVariableType() === "number") {
                this.selCounterVar.addItem(value.getName(), value.getName());
            }
        });


	// Boxes are filled using fillBoxe function
	this.fillBoxes();
    }

    // This function fills the boxes with the previously selected option
    fillBoxes(){
        const {
            gridSettingList,
            gripperSettingList,
            productSettingList
        } = this.getLists();

	    // If a grid is selected in the data model and this grid is present in the settings list it is set in the select box
	    if(this.dataModel.has('selectedGrid')){
		    let selectedGrid = this.dataModel.get('selectedGrid');
		    let check = true;
		    gridSettingList.forEach(value => {
            		if(value.name == selectedGrid){
				        this.selGrid.selectItem(selectedGrid);
                    check = false;
			        }
            });
		    // if no match is found between grid setting in the data model and the grid setting list, the setting has been deleted and thus will also be removed from the data model
            if(check){this.dataModel.delete('selectedGrid');} 
	    }
	
	    // If a gripper is selected in the data model and this grid is present in the settings list it is set in the select box
	    if(this.dataModel.has('selectedGripper')){
            let selectedGripper = this.dataModel.get('selectedGripper');
            let check = true;
		    gripperSettingList.forEach(value => {
			    if(value.name == selectedGripper){
                    this.selGripper.selectItem(selectedGripper);
                    check = false;
			    }
            });
            // if no match is found between gripper setting in the data model and the gripper setting list, the setting has been deleted and thus will also be removed from the data model
            if(check){this.dataModel.delete('selectedGripper');} 
	    }

	    // If a product is selected in the data model and this grid is present in the settings list it is set in the select box
	    if(this.dataModel.has('selectedProduct')){
            let selectedProduct = this.dataModel.get('selectedProduct');
            let check = true;
		    productSettingList.forEach(value=> {
			    if(value.name == selectedProduct){
                    this.selProduct.selectItem(selectedProduct);
                    check = false;
			    }
            });
		    // if no match is found between product setting in the data model and the product setting list, the setting has been deleted and thus will also be removed from the data model
            if(check){this.dataModel.delete('selectedProduct');} 
        }
    
        // If a product is selected in the data model and this grid is present in the settings list it is set in the select box
	    if(this.dataModel.has('selectedCounter')){
            let selectedCounter = this.dataModel.get('selectedCounter');
            let check = true;
            let variables = this.variableModel.getAll();
		    variables.forEach(value=> {
			    if(value.getName() == selectedCounter){
                    this.selCounterVar.selectItem(selectedCounter);
                    check = false;
			    }
            });
		    // if no match is found between product setting in the data model and the product setting list, the setting has been deleted and thus will also be removed from the data model
            if(check){this.dataModel.delete('selectedCounter');} 
        }

	    // If a stack type is selected in the data model, this is set in the select box
	    if(this.dataModel.has('selectedStackType')){
		    let selectedStackType = this.dataModel.get('selectedStackType');
		    this.selStackType.selectItem(selectedStackType);
	    }
	
        // If a speed is already selected in the data model, this is set in the input box
        if(this.dataModel.has('selectedSpeed')){
            let selectedSpeed = this.dataModel.get('selectedSpeed');
            this.inpSpeed.setText(selectedSpeed);
        }

        // If an acceleration is already selected in the data model, this is set in the input box
        if(this.dataModel.has('selectedAcc')){
            let selectedAcc = this.dataModel.get('selectedAcc');
            this.inpAcc.setText(selectedAcc);
        }

        // Blending option
        if(this.dataModel.has('blendingSelect')){
            if(this.dataModel.get("blendingSelect") == true){
                this.CbBlending.setChecked(true);
                this.inpRadius.setDisabled(false);
            } else {
                this.CbBlending.setChecked(false);
                this.inpRadius.setDisabled(true);
            }
            
        } else {
            this.dataModel.set('blendingSelect', false);
            this.CbBlending.setChecked(false);
            this.inpRadius.setDisabled(true);
        }

        // Blending radius
        if(this.dataModel.has('blendingRadius')){
            this.inpRadius.setText(this.dataModel.get("blendingRadius"));
        } else {
            this.dataModel.set('blendingRadius',0);
            this.inpRadius.setText(0);
        }
    }

    getVariables(){
        let selectedGrid = this.dataModel.get('selectedGrid');
        let selectedGripper = this.dataModel.get('selectedGripper');
        let selectedProduct = this.dataModel.get('selectedProduct');
        let selectedStackType = this.dataModel.get('selectedStackType');
        let selectedSpeed = this.dataModel.get('selectedSpeed');
        let selectedAcc = this.dataModel.get('selectedAcc');
        let selectedCounter = this.dataModel.get('selectedCounter');
        let blendingSelect = this.dataModel.get('blendingSelect');
        let blendingRadius = this.dataModel.get('blendingRadius');

        return{
            selectedGrid,
            selectedGripper,
            selectedProduct,
            selectedStackType,
            selectedSpeed,
            selectedAcc,
            selectedCounter,
            blendingSelect,
            blendingRadius
        };
    }

    getLists(){
        let gripperSettingList = this.extension.getGripperSettingList();
        let gridSettingList = this.extension.getGridSettingList();
        let productSettingList = this.extension.getProductSettingList();

        return {
            gridSettingList,
            gripperSettingList,
            productSettingList
        };
    }
}



module.exports = HCT_1200ProgramNodeContribution;