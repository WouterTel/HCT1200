const ExtensionNodeContribution = require('rodix_api').ExtensionNodeContribution;
const fs = require('fs');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Bugs to be fixed/Additions to be done:

*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class HCT_1200ExtensionNodeContribution extends ExtensionNodeContribution {
    constructor(rodiAPI, dataModel){
        super();
        this.rodiAPI = rodiAPI;
        this.dataModel = dataModel;

        this.uiHandler = this.rodiAPI.getUIHandler();
        this.components = this.uiHandler.getAllUIComponents();
        this.userInteraction = this.rodiAPI.getUserInteraction(); 
        this.IOModel = this.rodiAPI.getIOModel();

	    this.console = this.rodiAPI.getUserInteraction().Console;	// Defining console, this is only used for checks during debugging

        // Since old settings might not be compatible with the newer version of this plug in, the user gets the option to delete them.
        if(this.dataModel.has("firstTimeStarting") == false){
            this.rodiAPI.getUserInteraction().MessageBox.show('ERROR','It is adviced to clear old settings of the HCT-1200 plug in since these may not be compatible with the newer version. Would you like to clear these settings?','ERROR','YesNo',value => {
                if(value == "Yes"){
                    this.dataModel.delete("gripperSettingList");
                    this.dataModel.delete("gridSettingList");
                    this.dataModel.delete("productSettingList");
                    this.dataModel.delete("axisOrientation");
                    this.dataModel.delete("robotCalibration");
                    this.dataModel.delete("robotCalibrationLeft");
                    this.dataModel.delete("robotCalibrationRight");
                    this.dataModel.set("firstTimeStarting",1);
                    this.rodiAPI.getUserInteraction().MessageBox.show('Info','Old settings have been cleared.','Info','OK');
                } else if (value == "No"){
                    this.dataModel.set("firstTimeStarting",1);
                    this.rodiAPI.getUserInteraction().MessageBox.show('Info','Old settings have not been cleared.','Info','OK');
                }
            });
        }
        
	    // Definition of all the buttons
        this.uiHandler.on('btnCreatePattern', this.onBtnCreatePattern.bind(this));
        this.uiHandler.on('btnSetProducts', this.onBtnSetProducts.bind(this));
        this.uiHandler.on('btnSetGrippers', this.onBtnSetGrippers.bind(this));
        this.uiHandler.on('btn-robot-calibration', this.onBtnRobotCalibration.bind(this));
        this.uiHandler.on('btn-create-setting', this.onButtonCreateSetting.bind(this));
        this.uiHandler.on('btn-cancel', this.onBtnCancel.bind(this));
        this.uiHandler.on('btn-create-new', this.onBtnCreateNew.bind(this));
        this.uiHandler.on('btn-edit', this.onBtnEdit.bind(this));
        this.uiHandler.on('btn-delete', this.onBtnDelete.bind(this));
        this.uiHandler.on('btn-back', this.onBtnBack.bind(this));
        this.uiHandler.on('btn-next', this.onBtnNext.bind(this));
        this.uiHandler.on('btn-save', this.onBtnSave.bind(this));
        this.uiHandler.on('btn-set-robot-pos-left', this.onBtnSetRobotPosLeft.bind(this));
        this.uiHandler.on('btn-set-robot-pos-right', this.onBtnSetRobotPosRight.bind(this));
        
        // All of the selectboxes in the UI are defined here.
        this.uiHandler.on('selConnectionType', this.onSelConnectionType.bind(this));
	
	    // Robotiq extension definition
        this.extensionRobotiq = this.rodiAPI.getExtensionContribution('gripperExtensionNodeContribution');

        // Here we define the different screens of the plugin extension. Each screen has an handle with wich to call the screen ('screen') and an ID ('number')
        this.homeScreen = {'screen': this.components.homeScreen, 'number': 0};
        this.createNewOverlay = {'screen': this.components.createNewOverlay_1, 'number': 1};
        this.inputScreenGrid = {'screen': this.components.inputScreenGrid, 'number': 2};
        this.inputScreenGridA = {'screen': this.components.inputScreenGridA, 'number': 3};
        this.inputScreenGridB = {'screen': this.components.inputScreenGridB, 'number': 4};
        this.inputScreenGridC = {'screen': this.components.inputScreenGridC, 'number': 5};
        this.inputScreenGridD = {'screen': this.components.inputScreenGridD, 'number': 6};
        this.calibrationScreen = {'screen': this.components.calibrationScreen, 'number': 7};
        this.calibrationScreenB = {'screen': this.components.calibrationScreenB, 'number': 8};
        this.calibrationScreenC = {'screen': this.components.calibrationScreenC, 'number': 17};
        this.inputScreenGripper = {'screen': this.components.inputScreenGripper, 'number': 9};
        this.inputScreenGripperA = {'screen': this.components.inputScreenGripperA, 'number': 10};
        this.inputScreenGripperB = {'screen': this.components.inputScreenGripperB, 'number': 11};
        this.inputScreenGripperC = {'screen': this.components.inputScreenGripperC, 'number': 11};
        this.inputScreenGripperD = {'screen': this.components.inputScreenGripperD, 'number': 11};
        this.inputScreenGripperE = {'screen': this.components.inputScreenGripperE, 'number': 11};
        this.inputScreenGripperF = {'screen': this.components.inputScreenGripperF, 'number': 11};
        this.inputScreenProduct = {'screen': this.components.inputScreenProduct, 'number': 13};
        this.inputScreenProductA = {'screen': this.components.inputScreenProductA, 'number': 14};
        this.inputScreenProductB = {'screen': this.components.inputScreenProductB, 'number': 15};
        this.inputScreenProductC = {'screen': this.components.inputScreenProductC, 'number': 16};

        // Defining all of the selectboxes
        this.selRasterEdit = this.components.selRasterEdit;
        this.selGripperEdit = this.components.selGripperEdit;
        this.selGripperBrand = this.components.selGripperBrand;
        this.selGripperType = this.components.selGripperType;
        this.selSuctionAction = this.components.selSuctionAction;
        this.selConnectionType = this.components.selConnectionType;
        this.selGripperOutputOpen = this.components.selGripperOutputOpen;
        this.selGripperOutputClose = this.components.selGripperOutputClose;
        this.selGripperAction = this.components.selGripperAction;
        this.selProductEdit = this.components.selProductEdit;
        this.selCalibrationPosition = this.components.selCalibrationPosition;

        // Defining all of the inputboxes
        this.inpCreateNewName = this.components.inpCreateNewName;
        this.inpGridDeltaY = this.components.inpGridDeltaY;
        this.inpGridDeltaX = this.components.inpGridDeltaX;
        this.inpGridDeltaZ = this.components.inpGridDeltaZ;
        this.inpStartEndY = this.components.inpStartEndY;
        this.inpStartEndX = this.components.inpStartEndX;
        this.inpStartEndZ = this.components.inpStartEndZ;
        this.inpProductsX = this.components.inpProductsX;
        this.inpProductsY = this.components.inpProductsY;
        this.inpProductsZ = this.components.inpProductsZ;
        this.inpProductDeltaY = this.components.inpProductDeltaY;
        this.inpProductDeltaX = this.components.inpProductDeltaX;
        this.inpProductDeltaZ = this.components.inpProductDeltaZ;
        this.inpProductWeight = this.components.inpProductWeight;
        this.inpOrientation1rx = this.components.inpOrientation1rx;
        this.inpOrientation1ry = this.components.inpOrientation1ry;
        this.inpOrientation1rz = this.components.inpOrientation1rz;
        this.inpOrientation2rx = this.components.inpOrientation2rx;
        this.inpOrientation2ry = this.components.inpOrientation2ry;
        this.inpOrientation2rz = this.components.inpOrientation2rz;
        this.inpPosOrientation2 = this.components.inpPosOrientation2;
        this.inpProductsToSkip = this.components.inpProductsToSkip;
        this.inpNoGoZoneX = this.components.inpNoGoZoneX;
        this.inpNoGoZoneY = this.components.inpNoGoZoneY;
        this.inpMaxReachX = this.components.inpMaxReachX;
        this.inpMaxReachY = this.components.inpMaxReachY;
        this.inpWidthOnRobotGripper = this.components.inpWidthOnRobotGripper;
        this.inpForceOnRobotGripper = this.components.inpForceOnRobotGripper;
        this.inpWidthRobotiqGripper = this.components.inpWidthRobotiqGripper;
        this.inpSpeedRobotiqGripper = this.components.inpSpeedRobotiqGripper;
        this.inpForceRobotiqGripper = this.components.inpForceRobotiqGripper;

	    // Defining the default inputs of the selectboxes
        this.selCalibrationSideContent = ["Right", "Left"];
        this.selGripperBrandContent = ["Schunk", "OnRobot", "Other"];
        this.selGripperTypeSchunkContent = ["Co-Act"];
        this.selGripperTypeOnRobotContent = ["RG-6"];
        this.selGripperTypeRobotiqContent = ["2F-85/140", "Hand-E"];
        this.selGripperList = ["Schunk Co-Act","OnRobot RG-6","Robotiq 2F-85/140","Robotiq Hand-E","Robotiq AirPick","IO-based gripper"];
        this.selGripperTypeOtherContent = ["IO-Based"];
        this.selConnectionTypeContent = ["Controller", "Tool"];
        this.selGripperActionContent = ["Open", "Close"];
        this.selSuctionActionContent = ["Pick","Drop"];
        this.selGripperOutputOpenControllerContent = [0, 1, 2, 3, 4, 5, 6, 7];
        this.selGripperOutputCloseControllerContent = [0, 1, 2, 3, 4, 5, 6, 7];
        this.selGripperOutputOpenToolContent = [0, 1, 2, 3];
        this.selGripperOutputCloseToolContent = [0, 1, 2, 3];

        // Defining image boxes
        this.no_go_zone_max_min_reach = this.components.no_go_zone_max_min_reach;
        this.raster_no_of_products = this.components.raster_no_of_products;
        this.raster_start_end_xy = this.components.raster_start_end_xy;
        this.raster_deltax_deltay = this.components.raster_deltax_deltay;
        this.product_delta_xy = this.components.product_delta_xy;
        this.ioGripper = this.components.ioGripper;
        this.gripperRobotiq = this.components.gripperRobotiq;

        // Defining labels
        this.lbConnectionType = this.components.lbConnectionType;
        this.lbGripperOutputOpen = this.components.lbGripperOutputOpen;
        this.lbGripperOutputClose = this.components.lbGripperOutputClose;
    }

    openView(){
        
        // When the plug-in is opened the homescreen is showen
        this.switchScreen(this.homeScreen);

        // If the necessary lists are not yet present, they are created
        if(!this.dataModel.has("gridSettingList")) {
            let gridSettingArray = [];
            this.dataModel.set("gridSettingList", gridSettingArray);
        }

        if(!this.dataModel.has("gripperSettingList")) {
            let gripperSettingArray = [];
            this.dataModel.set("gripperSettingList", gripperSettingArray);
        }

        if(!this.dataModel.has("productSettingList")) {
            let productSettingArray = [];
            this.dataModel.set("productSettingList", productSettingArray);
        }

        // If the robot has not yet been calibrated only the calibration button is shown.
        if(!this.dataModel.has("robotCalibrationLeft") | !this.dataModel.has("robotCalibrationRight")) {
            this.setButtonVisible();
        }else{
            this.setButtonVisible();
            let axisOrientation = this.dataModel.get("axisOrientation");
            this.changeAxisOrientationOnImages(axisOrientation.direction);
        }

        this.updateSelBoxes();
        
        //We refresh the uiHandler in order to make sure that all of visual changes to the screen are visible.
        this.uiHandler.render();
        
    }
    closeView(){

    }
    generateScript(enterWriter, exitWriter){
        
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*

	General functions

*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function is used to switch between screens in the plugin extension.
    switchScreen(target){ 
        //First all of the screens are set invisible.
        
	    this.homeScreen.screen.setVisible(false); 
        this.inputScreenGrid.screen.setVisible(false);
        this.createNewOverlay.screen.setVisible(false); 
        this.inputScreenGridA.screen.setVisible(false); 
        this.inputScreenGridB.screen.setVisible(false); 
        this.inputScreenGridC.screen.setVisible(false); 
        this.inputScreenGridD.screen.setVisible(false); 
        this.calibrationScreen.screen.setVisible(false); 
        this.calibrationScreenB.screen.setVisible(false);
        this.calibrationScreenC.screen.setVisible(false); 
        this.inputScreenGripper.screen.setVisible(false); 
        this.inputScreenGripperA.screen.setVisible(false); 
        this.inputScreenGripperB.screen.setVisible(false); 
        this.inputScreenGripperC.screen.setVisible(false); 
        this.inputScreenGripperD.screen.setVisible(false); 
        this.inputScreenGripperE.screen.setVisible(false);
        this.inputScreenGripperF.screen.setVisible(false);
        this.inputScreenProduct.screen.setVisible(false); 
        this.inputScreenProductA.screen.setVisible(false); 
        this.inputScreenProductB.screen.setVisible(false); 
        this.inputScreenProductC.screen.setVisible(false); 

        //Then the screen that is set to be switched to, is set to visible
        target.screen.setVisible(true);

	    // Current screen ID number is updated
        this.dataModel.set("currentScreen", target.number);

        //We refresh the uiHandler in order to make sure that all of visual changes to the screen are visible.
        this.uiHandler.render();
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Buttons
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    onBtnCreatePattern(type) {
        if(type === 'click') {
            this.switchScreen(this.inputScreenGrid);
        }
    }

    onBtnSetProducts(type) {
        if(type === 'click') {
            this.switchScreen(this.inputScreenProduct);
        }
    }

    onBtnSetGrippers(type) {
        if(type === 'click') {
            this.switchScreen(this.inputScreenGripper);
        }
    }

    onBtnRobotCalibration(type) {
        if(type === 'click') {
            this.switchScreen(this.calibrationScreen);
        }
    }

    onBtnCreateNew(type) {
        if(type === 'click') {
            this.createNewOverlay.screen.setVisible(true);
            this.inpCreateNewName.setText("");
            this.uiHandler.render();
        }
    }

    onBtnCancel(type) {
        if(type === 'click') {
            this.createNewOverlay.screen.setVisible(false);
            this.uiHandler.render();
        }
    }

    // Function is called when create button is pressed
    onButtonCreateSetting(type) {
        if(type === 'click') {
            let number = this.dataModel.get("currentScreen");

	        // If no name is given the program throws an error
            if(this.inpCreateNewName.getText() === "") {
                this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please fill in a name for the new setting', 'ERROR', 'OK');
	    
	        // Else the program creates the appropriate option
            } else {
                switch (number) {

		            // Create grid settings
                    case 2:
			            // Create array 'gridSelValues' with all the names already in use
                        let gridSelBoxItems = this.selRasterEdit.getItems();
                        let gridSelBoxValues = [];
                        gridSelBoxItems.forEach(value => {
                            gridSelBoxValues.push(value.value);
                        });
			
			            // Checks if given name is already in list, if not, new setting is created
                        if(!gridSelBoxValues.includes(this.inpCreateNewName.getText())) {
                            let gridSettingArray = this.dataModel.get("gridSettingList");

			                // Create new grid setting 
                            let gridSetting = {'name': this.inpCreateNewName.getText(), 'data': [0,0,0, 0,0,0, 1,1,1,[] ,0,0,1300,1300]};  // Create new grid setting
                            gridSettingArray.push(gridSetting);										   // Add grid setting to array with settings

                            this.dataModel.set("gridSettingList", gridSettingArray);	// Update grid setting array in data model
                            this.dataModel.save();					// Save data model
                            this.updateSelBoxes();					// Add new setting name to select box
                            this.createNewOverlay.screen.setVisible(false);		// Let overlay page dissapear
                            //this.uiHandler.render();

			                // Screen is switched to first edit screen
			                this.selRasterEdit.selectItem(gridSetting.name);
			                this.fillInputBoxesGrid(gridSetting.name);
			                this.switchScreen(this.inputScreenGridA);

                        } else {
                            this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'The given name for the setting already exists', 'ERROR', 'OK');
                        }

                        break;
		
		            // Create gripper setting
                    case 9:
                        let gripperSelBoxItems = this.selGripperEdit.getItems();
                        let gripperSelBoxValues = [];
                        gripperSelBoxItems.forEach(value => {
                            gripperSelBoxValues.push(value.value);
                        });
                        if(!gripperSelBoxValues.includes(this.inpCreateNewName.getText())) {
                            let gripperSettingArray = this.dataModel.get("gripperSettingList");
                            let gripperSetting = {'name': this.inpCreateNewName.getText(), 'data': ["", "", "", "", ""]};
                            gripperSettingArray.push(gripperSetting);

                            this.dataModel.set("gripperSettingList", gripperSettingArray);

                            //this.dataModel.save();
                            this.updateSelBoxes();
                            this.createNewOverlay.screen.setVisible(false);
			                //this.uiHandler.render();

			                // Screen is switched to first edit screen
			                this.selGripperEdit.selectItem(gripperSetting.name);
			                this.setGripperPageOne(gripperSetting.name);
			                this.switchScreen(this.inputScreenGripperA);
                        } else {
                            this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'The given name for the setting already exists', 'ERROR', 'OK');
                        }
    
                        break;

		            // Create product setting
                    case 13:
                        let productSelBoxItems = this.selProductEdit.getItems();
                        let productSelBoxValues = [];
                        productSelBoxItems.forEach(value => {
                            productSelBoxValues.push(value.value);
                        });
                        if(!productSelBoxValues.includes(this.inpCreateNewName.getText())) {
                            let productSettingArray = this.dataModel.get("productSettingList");

                            let productSetting = {'name': this.inpCreateNewName.getText(), 'data': [0,0,0, 0, 180,0,0, 180,0,0, []]};
                            productSettingArray.push(productSetting);

                            this.dataModel.set("productSettingList", productSettingArray);
                            this.dataModel.save();
                            this.updateSelBoxes();
                            this.createNewOverlay.screen.setVisible(false);
                            //this.uiHandler.render();

			                // Screen is switched to first edit screen
			                this.selProductEdit.selectItem(productSetting.name);
			                this.fillInputBoxesProduct(productSetting.name);
			                this.switchScreen(this.inputScreenProductA);
                        } else {
                            this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'The given name for the setting already exists', 'ERROR', 'OK');
                        }
                }
            }
        }
    }

    onBtnDelete(type) {
        if(type === 'click') {

            let number = this.dataModel.get("currentScreen");

            switch (number) {
                case 2:
                    let gridSelBoxItems = this.selRasterEdit.getItems();
                    let gridSelBoxValues = [];
                    gridSelBoxItems.forEach(value => {
                        gridSelBoxValues.push(value.value);
                    });
                    if(!gridSelBoxValues.includes(String(this.selRasterEdit.getSelectedItem()))) {
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please select a grid setting to delete', 'ERROR', 'OK');
                    } else {
                        this.rodiAPI.getUserInteraction().MessageBox.show('DELETE FILE', 'Are you sure you want to delete?', 'WARNING', 'YesNo', value => {
                            if(value === "Yes") {
                                let gridSettingArray = this.dataModel.get("gridSettingList");

                                let gridToBeDeleted = this.selRasterEdit.getSelectedItem();
                                
                                gridSettingArray.forEach((value, index) => {
                                    if(value.name === gridToBeDeleted) {
                                        gridSettingArray.splice(index, 1); 
                                    }
                                });

                                this.dataModel.set("gridSettingList", gridSettingArray);   
                                
                                this.dataModel.save();
            
                                this.updateSelBoxes();

                                this.uiHandler.render();
                            } 
                        });
                    }
                    break;
                case 9:
                    let gripperSelBoxItems = this.selGripperEdit.getItems();
                    let gripperSelBoxValues = [];
                    gripperSelBoxItems.forEach(value => {
                        gripperSelBoxValues.push(value.value);
                    });
                    if(!gripperSelBoxValues.includes(String(this.selGripperEdit.getSelectedItem()))) {
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please select a gripper setting to delete', 'ERROR', 'OK');
                    } else {
                        this.rodiAPI.getUserInteraction().MessageBox.show('DELETE FILE', 'Are you sure you want to delete?', 'WARNING', 'YesNo', value => {
                            if(value === "Yes") {
                                let gripperSettingArray = this.dataModel.get("gripperSettingList");

                                let gripperToBeDeleted = this.selGripperEdit.getSelectedItem();
                                
                                gripperSettingArray.forEach((value, index) => {
                                    if(value.name === gripperToBeDeleted) {
                                        gripperSettingArray.splice(index, 1); 
                                    }
                                });

                                this.dataModel.set("gripperSettingList", gripperSettingArray);   

                                this.dataModel.save();
            
                                this.updateSelBoxes();

                                this.uiHandler.render();
                            } 
                        });
                    }
                    break;
                case 13:
                    let productSelBoxItems = this.selProductEdit.getItems();
                    let productSelBoxValues = [];
                    productSelBoxItems.forEach(value => {
                        productSelBoxValues.push(value.value);
                    });
                    if(!productSelBoxValues.includes(String(this.selProductEdit.getSelectedItem()))) {
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please select a product setting to delete', 'ERROR', 'OK');
                    } else {
                        this.rodiAPI.getUserInteraction().MessageBox.show('DELETE FILE', 'Are you sure you want to delete?', 'WARNING', 'YesNo', value => {
                            if(value === "Yes") {
                                let productSettingArray = this.dataModel.get("productSettingList");

                                let productToBeDeleted = this.selProductEdit.getSelectedItem();
                                
                                productSettingArray.forEach((value, index) => {
                                    if(value.name === productToBeDeleted) {
                                        productSettingArray.splice(index, 1); 
                                    }
                                });

                                this.dataModel.set("productSettingList", productSettingArray);  

                                this.dataModel.save();
            
                                this.updateSelBoxes();

                                this.uiHandler.render();
                            } 
                        });
                    }
            }
        }
    }

    onBtnNext(type) {
        if(type === 'click') {
            let number = this.dataModel.get("currentScreen");

            let targetScreen;

            switch (number) {
                case 2:
                    targetScreen = this.inputScreenGridA;
                    break;
                case 3:
                    targetScreen = this.inputScreenGridB;
                    break;
                case 4:
                    targetScreen = this.inputScreenGridC;
                    break;
                case 5:
                    targetScreen = this.inputScreenGridD;
                    break;
                case 7:
                    targetScreen = this.calibrationScreenB;
                    break;
                case 9:
                    targetScreen = this.inputScreenGripperA;
                    break;
                case 10:
		            if(this.selGripperBrand.getSelectedItem()==""){
			            this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please select a gripper', 'ERROR', 'OK');
                        return;
		            } else {
                        this.setGripperPageTwo(this.selGripperEdit.getSelectedItem());
			            targetScreen = this.targetScreenGripper;
		            }
                    break;
                case 13:
                    targetScreen = this.inputScreenProductA;
                    break;
                case 14:
                    targetScreen = this.inputScreenProductB;
                    break;
                case 15:
                    targetScreen = this.inputScreenProductC;
		            break;
                case 17:
                    targetScreen = this.calibrationScreenC;
                    break;
		        default:
		            targetScreen = this.homescreen;
            }

            this.switchScreen(targetScreen);
        }
    }

    onBtnBack(type) {
        if(type === 'click') {
            let number = this.dataModel.get("currentScreen");

            let targetScreen = this.homeScreen;

            switch (number) {
                case 2:
                    targetScreen = this.homeScreen;
                    break;
                case 3:
                    targetScreen = this.inputScreenGrid;
                    break;
                case 4:
                    targetScreen = this.inputScreenGridA;
                    break;
                case 5:
                    targetScreen = this.inputScreenGridB;
                    break;
                case 6:
                    targetScreen = this.inputScreenGridC;
                    break;
                case 7:
                    targetScreen = this.homeScreen;
                    break;
                case 8:
                    targetScreen = this.calibrationScreen;
                    break;
                case 9:
                    targetScreen = this.homeScreen;
                    break;
                case 10:
                    let valueArray = [];
                    let settingName = this.selGripperEdit.getSelectedItem();
                    let settingArray = this.dataModel.get("gripperSettingList");
                    settingArray.forEach(value => {
                        if(value.name === settingName) {
                            valueArray = value.data;
                        }
                    });

                    if(valueArray[0] == ""){
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR','Are you sure you want to go back? Settings will be deleted.','ERROR','YesNo',value => {
                            if(value == 'Yes'){
                                settingArray.forEach((value, index) => {
                                    if(value.name === settingName) {
                                        settingArray.splice(index, 1); 
                                    }
                                });
                                targetScreen = this.inputScreenGripper;
                                this.updateSelBoxes();
                                this.switchScreen(targetScreen);
                            }
                        });
                        return;
                    }
                    targetScreen = this.inputScreenGripper;
                    this.updateSelBoxes();
                    break;
                case 11:
                    targetScreen = this.inputScreenGripperA;
                    break;
                case 13:
                    targetScreen = this.homeScreen;
                    break;
                case 14:
                    targetScreen = this.inputScreenProduct;
                    break;
                case 15:
                    targetScreen = this.inputScreenProductA;
                    break;
                case 16:
                    targetScreen = this.inputScreenProductB;
            }

            this.switchScreen(targetScreen);
        }
    }

    onBtnEdit(type) {
        if(type === 'click') {
            let number = this.dataModel.get("currentScreen");
        
            switch (number) {
                case 2:
                    if(this.selRasterEdit.getSelectedItem() === "") {
                        this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Please select a grid setting to edit", 'ERROR', 'OK');
                    } else {
                        this.fillInputBoxesGrid(this.selRasterEdit.getSelectedItem());
                        this.switchScreen(this.inputScreenGridA);
                    }
                    break;
                case 9:
                    if(this.selGripperEdit.getSelectedItem() === "") {
                        this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Please select a gripper setting to edit", 'ERROR', 'OK');
                    } else {
                        this.setGripperPageOne(this.selGripperEdit.getSelectedItem());
                        this.switchScreen(this.inputScreenGripperA);
                    }
                    break;
                case 13:
                    if(this.selProductEdit.getSelectedItem() === "") {
                        this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Please select a product setting to edit", 'ERROR', 'OK');
                    } else {
                        this.fillInputBoxesProduct(this.selProductEdit.getSelectedItem());
                        this.switchScreen(this.inputScreenProductA);
                    }
            }
        }
    }

    onBtnSave(type) {
        if(type === 'click') {
            let number = this.dataModel.get("currentScreen");

            switch (number) {
		        //Saving grid settings
                case 6:
		            // Checking if there are no problems in the grid settings. If not, settings are saved.
		            if((this.inpStartEndZ.getText()==0 && this.inpProductsZ.getText() > 1) || (this.inpStartEndY.getText()==0 && this.inpProductsY.getText() > 1) || (this.inpStartEndX.getText()==0 && this.inpProductsX.getText() > 1)){
			            this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Start-End distance can't be zero if number of products in this direction is larger than 1.", 'ERROR', 'OK');
		            } else if((this.inpStartEndZ.getText()>0 && this.inpProductsZ.getText() == 1) || (this.inpStartEndY.getText()>0 && this.inpProductsY.getText() == 1) || (this.inpStartEndX.getText()>0 && this.inpProductsX.getText() == 1)){
			            this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Start-End distance can't be larger than 1 if number of products in this direction is 1.", 'ERROR', 'OK');
		            } else {
                        let gridCheck = this.saveGridSettings(this.selRasterEdit.getSelectedItem());
                        if(gridCheck){
                            this.rodiAPI.getUserInteraction().MessageBox.show('SAVED', 'Settings saved!', 'INFO', 'OK');
                            this.switchScreen(this.homeScreen);
                        } else {this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Products to skip should be given as whole numbers seperated by a comma. f.i.: 1,2,3,4 \n If no products should be skipped, enter -1', 'ERROR', 'OK');}
		            }
                    break;
                case 11:
                    let gripCheck = this.saveGripperSettings(this.selGripperEdit.getSelectedItem());
                    if(gripCheck){
                        this.rodiAPI.getUserInteraction().MessageBox.show('SAVED', 'Settings saved!', 'INFO', 'OK');
                        this.switchScreen(this.homeScreen);
                    } else if(gripCheck == "wrong input"){
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'You can not open and close the gripper with the same output.', 'ERROR', 'OK');
                    } else {this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Please fill in all the necessary boxes correctly.', 'ERROR', 'OK');}
                    break;
                case 16:
                    let prodCheck = this.saveProductSettings(this.selProductEdit.getSelectedItem());
                    if(prodCheck){
                        this.rodiAPI.getUserInteraction().MessageBox.show('SAVED', 'Settings saved!', 'INFO', 'OK');
                        this.switchScreen(this.homeScreen);
                    } else {this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'Products to be picked in a different orientation should be given as whole numbers seperated by a comma. f.i.: 1,2,3,4 \n If no products should be skipped, enter -1', 'ERROR', 'OK');}
                    break;
            }

            this.dataModel.save();
        }
    }

    onBtnSetRobotPosLeft(type) {
        if(type === 'click') {
    
            //A Robot Position Panel object is created. 
            const robotPositionPanel = this.userInteraction.RobotPositionPanel;
    
            //This opens the manual control screen of the robot to set the position.
            robotPositionPanel.show(
                (tcp, flange, joint) => {
    
                    let pose = [tcp.x, tcp.y, tcp.z, tcp.rx, tcp.ry, tcp.rz];

                    // Axis orientation indicates in what orientation the robot is mounted on the tabel.
                    // Since the robot is bolted using a four bolt pattern there are four different ways to mount the robot to the tabel.
                    // This has an influence on the coordinates, hence this should be set in the data model.

                    // Offset indicates the distance from the edge of the table to the calibration position.
                    // sign indicates the direction of the X and Y axis, this is used in the createGridCoordinates function to calculate the position of the first product.
    
                    if((joint[0] > -45 && joint[0] < 45) || joint[0] > 315 || joint[0] < -315) { 
                        // X axis is pointing towards the tabel
                        let axisOrientation = {"direction": "X", "offset": [36.5, 336.5], "sign": [1, -1]};
                        this.dataModel.set("axisOrientation", axisOrientation);
    
                        this.changeAxisOrientationOnImages(axisOrientation.direction);
    
                    } else if((joint[0] > 45 && joint[0] < 135) || (joint[0] < -225 && joint[0] > -315)) { 
                        // Y axis is pointing towards the table
                        let axisOrientation = {"direction": "Y", "offset": [336.5, 36.5], "sign": [1, 1]};
                        this.dataModel.set("axisOrientation", axisOrientation);
    
                        this.changeAxisOrientationOnImages(axisOrientation.direction);
                        
                    } else if((joint[0] > 135 && joint[0] < 225) || (joint[0] < -135 && joint[0] > -225)) { 
                        // X axis is pointing away from the table
                        let axisOrientation = {"direction": "X", "offset": [36.5, 336.5], "sign": [-1, 1]};
                        this.dataModel.set("axisOrientation", axisOrientation);
    
                        this.changeAxisOrientationOnImages(axisOrientation.direction);
    
                    } else if((joint[0] > 235 && joint[0] < 315) || (joint[0] < -45 && joint[0] > -135)) { 
                        // Y axis is pointing away from the table
                        let axisOrientation = {"direction": "Y", "offset": [336.5, 36.5], "sign": [-1, -1]};
                        this.dataModel.set("axisOrientation", axisOrientation);
    
                        this.changeAxisOrientationOnImages(axisOrientation.direction);
    
                    } else {
                        this.rodiAPI.getUserInteraction().MessageBox.show('ERROR', 'An error occured during calibration', 'ERROR', 'OK');
    
                    }

                    // Saving the pose to the data model
                    this.dataModel.set("robotCalibration", pose);
                    this.dataModel.set("robotCalibrationLeft", pose);
                    this.dataModel.save();
    
                    //We refresh the uiHandler in order to make sure that all of visual changes to the screen are visible.
                    this.uiHandler.render();
    
                    // User is sent back to the homescreen.
                    this.switchScreen(this.calibrationScreenC);
                },
                () => {
                    console.log('cancelled');
                });
        }
    }
    onBtnSetRobotPosRight(type) {
        if(type === 'click') {
    
            //A Robot Position Panel object is created. 
            const robotPositionPanel = this.userInteraction.RobotPositionPanel;
    
            //This opens the manual control screen of the robot to set the position.
            robotPositionPanel.show(
                (tcp, flange, joint) => {
    
                    let pose = [tcp.x, tcp.y, tcp.z, tcp.rx, tcp.ry, tcp.rz];
    
                    // Saving the pose to the data model
                    this.dataModel.set("robotCalibrationRight", pose);
                    this.dataModel.save();
    
                    //We refresh the uiHandler in order to make sure that all of visual changes to the screen are visible.
                    this.uiHandler.render();
    
                    // Message is shown that indicates position is set correctly
                    this.rodiAPI.getUserInteraction().MessageBox.show('SET', 'Robot pose set correctly!', 'INFO', 'OK');
    
                    // Set buttons to visible
                    this.setButtonVisible();
    
                    // User is sent back to the homescreen.
                    this.switchScreen(this.homeScreen);
                },
                () => {
                    console.log('cancelled');
                });
        }
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Selectboxes
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Function that is called when the connection type of an IO gripper is changed
    onSelConnectionType(type, data) {
        if(type === 'select'){
            this.selGripperOutputOpen.removeAllItems();
            this.selGripperOutputClose.removeAllItems();
            if(data.selected === "Controller") {
                let IOs = this.IOModel.getGeneralDigitalOutput();
                this.selGripperOutputOpenControllerContent.forEach(value => {
                    let IOName = IOs[value].getName();
                    this.selGripperOutputOpen.addItem(IOName, String(value));
                    this.selGripperOutputClose.addItem(IOName, String(value));
                });
                this.selGripperOutputOpen.setDisabled(false);
                this.selGripperOutputClose.setDisabled(false);
                this.selGripperAction.setDisabled(false);
            } else if(data.selected === "Tool") {
                let IOs = this.IOModel.getToolDigitalOutput();
                this.selGripperOutputOpenToolContent.forEach(value => {
                    let IOName = IOs[value].getName();
                    this.selGripperOutputOpen.addItem(IOName, String(value));
                    this.selGripperOutputClose.addItem(IOName, String(value));
                });
                this.selGripperOutputOpen.setDisabled(false);
                this.selGripperOutputClose.setDisabled(false);
                this.selGripperAction.setDisabled(false);
            }
        }
    }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Set Screens
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setButtonVisible(){
        if(this.dataModel.has('robotCalibrationLeft') && this.dataModel.has('robotCalibrationRight')){
            this.components.btnCreatePattern.setVisible(true);
            this.components.btnSetGrippers.setVisible(true);
            this.components.btnSetProducts.setVisible(true);
        }else{
            this.components.btnCreatePattern.setVisible(false);
            this.components.btnSetGrippers.setVisible(false);
            this.components.btnSetProducts.setVisible(false);
        }
    }

    changeAxisOrientationOnImages(axisOrientation) {
        if(axisOrientation === "X") {
            this.no_go_zone_max_min_reach.setSrc("resource/no-go-zone-max-min-reach.png");
            this.raster_no_of_products.setSrc("resource/raster-no-of-products.png"); 
            this.raster_start_end_xy.setSrc("resource/raster-start-end-xy.png"); 
            this.raster_deltax_deltay.setSrc("resource/raster-deltax-deltay.png"); 
            this.product_delta_xy.setSrc("resource/product-delta-xy.png"); 
        } else if (axisOrientation === "Y") {
            this.no_go_zone_max_min_reach.setSrc("resource/no-go-zone-max-min-reach-2.png");
            this.raster_no_of_products.setSrc("resource/raster-no-of-products-2.png"); 
            this.raster_start_end_xy.setSrc("resource/raster-start-end-yx.png"); 
            this.raster_deltax_deltay.setSrc("resource/raster-deltay-deltax.png"); 
            this.product_delta_xy.setSrc("resource/product-delta-yx.png");
        }
    } 

    setGripperPageOne(settingName){
        this.selGripperType.setDisabled(true);
        let settingArray = this.dataModel.get("gripperSettingList");
        let valueArray = [];

        settingArray.forEach(value => {
            if(value.name === settingName) {
                valueArray = value.data;
            }
        });
        
        //this.selGripperType.removeAllItems();
        this.selGripperBrand.removeAllItems();
        this.selGripperList.forEach(value => {
            this.selGripperBrand.addItem(value, value);
        });
        this.selGripperBrand.selectItem(valueArray[0]);

        if(this.extensionRobotiq == undefined) {
            this.selGripperBrand.removeItem("Robotiq Hand-E");
            this.selGripperBrand.removeItem("Robotiq 2F-85/140");
            this.selGripperBrand.removeItem("Robotiq AirPick");
        }

        this.uiHandler.render();
    }

    setGripperPageTwo(settingName){
        let settingArray = this.dataModel.get("gripperSettingList");
        let valueArray = [];
        let selectedGripper = this.selGripperBrand.getSelectedItem();
        settingArray.forEach(value => {
            if(value.name === settingName) {
                valueArray = value.data;
            }
        });

        if(selectedGripper != valueArray[0]){
            valueArray = ["","","",""];
        }

        // Remove items from boxes, correct ones will be added later in this function
        this.selGripperOutputClose.removeAllItems();
        this.selGripperOutputOpen.removeAllItems();
        this.selConnectionType.removeAllItems();
        this.selGripperAction.removeAllItems();

        // Add Open/Close option to box
        this.selGripperActionContent.forEach(value => {
            this.selGripperAction.addItem(value, value);
        });

        // Add Grip/Drop option to box
        this.selSuctionActionContent.forEach(value =>{
            this.selSuctionAction.addItem(value, value);
        });

        // Checking gripper type
        if(selectedGripper === "Schunk Co-Act"){
            // Set targetscreen
            this.targetScreenGripper = this.inputScreenGripperE;

            // set unnecessary boxes and labels to invisible
            this.lbConnectionType.setVisible(false);
            this.lbGripperOutputOpen.setVisible(false);
            this.lbGripperOutputClose.setVisible(false);
            this.selConnectionType.setVisible(false);
            this.selGripperOutputOpen.setVisible(false);
            this.selGripperOutputClose.setVisible(false);

            // Set picture
            this.ioGripper.setSrc("resource/gripper-schunk-egpc.png");

            // Set previously selected options in boxes
            this.selGripperAction.selectItem(valueArray[1]);
            
        } else if(selectedGripper === "OnRobot RG-6") {
            this.inpWidthOnRobotGripper.setText(valueArray[1]);
            this.inpForceOnRobotGripper.setText(valueArray[2]);
            this.targetScreenGripper = this.inputScreenGripperC;
        } else if(selectedGripper === "Robotiq 2F-85/140") {
            this.inpWidthRobotiqGripper.setText(valueArray[1]);
            this.inpSpeedRobotiqGripper.setText(valueArray[2]);
            this.inpForceRobotiqGripper.setText(valueArray[3]);
            this.targetScreenGripper = this.inputScreenGripperD;
            this.gripperRobotiq.setSrc("resource/gripper-robotiq.png");
        } else if(selectedGripper === "Robotiq Hand-E") {
            this.inpWidthRobotiqGripper.setText(valueArray[1]);
            this.inpSpeedRobotiqGripper.setText(valueArray[2]);
            this.inpForceRobotiqGripper.setText(valueArray[3]);
            this.targetScreenGripper = this.inputScreenGripperD;
            this.gripperRobotiq.setSrc("resource/Hand-e.png");
        } else if(selectedGripper === "Robotiq AirPick") {
            this.targetScreenGripper = this.inputScreenGripperF;
            this.selSuctionAction.selectItem(valueArray[1]);
        } else if(selectedGripper === "IO-based gripper") {
            // Fill connection type box with correct options
            this.selConnectionTypeContent.forEach(value => {
                this.selConnectionType.addItem(value, value);
            });

            // Set other boxes to visible and disabled
            this.lbConnectionType.setVisible(true);
            this.lbGripperOutputOpen.setVisible(true);
            this.lbGripperOutputClose.setVisible(true);
            this.selGripperOutputOpen.setVisible(true);
            this.selGripperOutputClose.setVisible(true);
            this.selConnectionType.setVisible(true);

            // Set picture
            this.ioGripper.setSrc("resource/io-gripper.png");

            // Set target screen
            this.targetScreenGripper = this.inputScreenGripperE;

            // Show previously selected options
            if(valueArray[1] == "Controller"){
                // fill Output boxes
                let IOs = this.IOModel.getGeneralDigitalOutput();
                this.selGripperOutputOpenControllerContent.forEach(value => {
                    let IOName = IOs[value].getName();
                    this.selGripperOutputOpen.addItem(IOName, String(value));
                    this.selGripperOutputClose.addItem(IOName, String(value));
                });

                // Show previously selected option in box
                this.selConnectionType.selectItem(valueArray[1]);
                this.selGripperOutputOpen.selectItem(valueArray[2]);
                this.selGripperOutputClose.selectItem(valueArray[3]);
                this.selGripperAction.selectItem(valueArray[4]);

                // Enable boxes
                this.selGripperOutputOpen.setDisabled(false);
                this.selGripperOutputClose.setDisabled(false);
                this.selGripperAction.setDisabled(false);
            } else if(valueArray[1] == "Tool"){
                // fill Output boxes
                let IOs = this.IOModel.getToolDigitalOutput();
                this.selGripperOutputOpenToolContent.forEach(value => {
                    let IOName = IOs[value].getName();
                    this.selGripperOutputOpen.addItem(IOName, String(value));
                    this.selGripperOutputClose.addItem(IOName, String(value));
                });

                // Show previously selected option in box
                this.selConnectionType.selectItem(valueArray[1]);
                this.selGripperOutputOpen.selectItem(valueArray[2]);
                this.selGripperOutputClose.selectItem(valueArray[3]);
                this.selGripperAction.selectItem(valueArray[4]);

                // Ensable boxes
                this.selGripperOutputOpen.setDisabled(false);
                this.selGripperOutputClose.setDisabled(false);
                this.selGripperAction.setDisabled(false);
            } else {
                // If no connection type is selected, other boxes are disabled
                this.selGripperOutputOpen.setDisabled(true);
                this.selGripperOutputClose.setDisabled(true);
                this.selGripperAction.setDisabled(true);
            }
        }
        this.uiHandler.render();
    }

    // Function that shows the grid settings in the select boxes when a grid is editted
    fillInputBoxesGrid(setting_name) {
        let settingArray = this.dataModel.get("gridSettingList");
        let valueArray = [];
        let inpProductsToSkipString = "";

        settingArray.forEach(value => {
            if(value.name === setting_name) {
                valueArray = value.data;
            }
        });

        valueArray[9].forEach((value, index) => {
            if(index < (valueArray[9].length - 1)) {
                inpProductsToSkipString += (String(value) + ",");
            } else {
                inpProductsToSkipString += String(value);
            }
        });

        // Add values to all the inputs
        this.inpGridDeltaX.setText(valueArray[0]);
        this.inpGridDeltaY.setText(valueArray[1]);
        this.inpGridDeltaZ.setText(valueArray[2]);
        this.inpStartEndX.setText(valueArray[3]);
        this.inpStartEndY.setText(valueArray[4]);
        this.inpStartEndZ.setText(valueArray[5]);
        this.inpProductsX.setText(valueArray[6]);
        this.inpProductsY.setText(valueArray[7]);
        this.inpProductsZ.setText(valueArray[8]);
        this.inpProductsToSkip.setText(inpProductsToSkipString);
        this.inpNoGoZoneX.setText(valueArray[10]);
        this.inpNoGoZoneY.setText(valueArray[11]);
        this.inpMaxReachX.setText(valueArray[12]);
        this.inpMaxReachY.setText(valueArray[13]);

	    // render screen to update boxes
	    this.uiHandler.render()
    }

    // Function that shows the product settings in the select boxes when a product is editted
    fillInputBoxesProduct(setting_name) {
        let settingArray = this.dataModel.get("productSettingList");
        let valueArray = [];
        let inpPosOrientationString = "";

        settingArray.forEach(value => {
            if(value.name === setting_name) {
                valueArray = value.data;
            }
        });

        valueArray[10].forEach((value, index) => {
            if(index < (valueArray[10].length - 1)) {
                inpPosOrientationString += (String(value) + ",");
            } else {
                inpPosOrientationString += String(value);
            }
        });

	    // Add values to all the boxes
        this.inpProductDeltaX.setText(valueArray[0]);
        this.inpProductDeltaY.setText(valueArray[1]);
        this.inpProductDeltaZ.setText(valueArray[2]);
        this.inpProductWeight.setText(valueArray[3]);
        this.inpOrientation1rx.setText(valueArray[4]);
        this.inpOrientation1ry.setText(valueArray[5]);
        this.inpOrientation1rz.setText(valueArray[6]);
        this.inpOrientation2rx.setText(valueArray[7]);
        this.inpOrientation2ry.setText(valueArray[8]);
        this.inpOrientation2rz.setText(valueArray[9]);
        this.inpPosOrientation2.setText(inpPosOrientationString);

	    // render screen to update boxes
	    this.uiHandler.render()

    }

    updateSelBoxes() {

        let gridSettingArray = this.dataModel.get("gridSettingList");
        let gripperSettingArray = this.dataModel.get("gripperSettingList");    
        let productSettingArray = this.dataModel.get("productSettingList");

        this.selRasterEdit.removeAllItems();
        this.selGripperEdit.removeAllItems();
        this.selProductEdit.removeAllItems();


        gridSettingArray.forEach(value => {
            this.selRasterEdit.addItem(value.name, value.name);
        });

        gripperSettingArray.forEach(value => {
            this.selGripperEdit.addItem(value.name, value.name);
        });

        productSettingArray.forEach(value => {
            this.selProductEdit.addItem(value.name, value.name);
        });

    }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Saving settings
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Function to safe grid settings
    saveGridSettings(setting_name){

        // Check if products to skip string is filled out correctly
        let productsToSkipString = this.inpProductsToSkip.getText();
        let checkString = "0123456789,-";   // Only characters that should be pressent in the string
        let arr = [];
        let i, p;
       
        for(i = 0; i < productsToSkipString.length; i++){
           p = checkString.indexOf(productsToSkipString[i]); // Check if character is part of allowed collection
           arr.push(p); 
           // Check for every possible faulty entry
           if(p == -1 || (i == 0 && p == 10) || (p == 10 && arr[i-1] == 10) || (p == 11 && arr[i-1] == 11) || (p == 11 && arr[i-1] != 10 && i != 0) || (p == 11 && i == (productsToSkipString.length-1)) || (productsToSkipString.length == 1 && p == 11 )){
                // If entry is faulty settings are not saved
                return false;
           }
        }

        let settingArray = this.dataModel.get("gridSettingList");	// Get array containing grid settings from data model

	    // Convert string input to array
        if(productsToSkipString == "-1"){productsToSkipString = ""}
        let productsToSkipArray = productsToSkipString.split(",");

	    // Create new grid setting
        let gridSetting = {'name': setting_name, 'data': [this.inpGridDeltaX.getText(), this.inpGridDeltaY.getText(), this.inpGridDeltaZ.getText(), this.inpStartEndX.getText(), this.inpStartEndY.getText(), this.inpStartEndZ.getText(), this.inpProductsX.getText(), this.inpProductsY.getText(), this.inpProductsZ.getText(), productsToSkipArray, this.inpNoGoZoneX.getText(), this.inpNoGoZoneY.getText(), this.inpMaxReachX.getText(), this.inpMaxReachY.getText()]};

	    // Update settings in setting array
        settingArray.forEach((value, index) => {
            if(value.name === setting_name) {
                settingArray.splice(index, 1);  // delete old version
                settingArray.push(gridSetting);	// create new version
            }
        });

	    // Update setting array in data model
        this.dataModel.set("gridSettingList", settingArray);
        this.dataModel.save();

        return true;
    }

    saveGripperSettings(setting_name) {
        let settingArray = this.dataModel.get("gripperSettingList");
        let gripperSetting = {'name': setting_name, 'data': []};

        if(this.selGripperBrand.getSelectedItem() === "Schunk Co-Act") {
            if(this.selGripperAction.getSelectedItem() == ""){
                return false;
            } else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), "Tool", 1, 0, this.selGripperAction.getSelectedItem()];
            }
        } else if(this.selGripperBrand.getSelectedItem() === "OnRobot RG-6") {
            if(this.inpWidthOnRobotGripper.getText() == "" || this.inpForceOnRobotGripper.getText() == ""){
                return false;
            } else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), this.inpWidthOnRobotGripper.getText(), this.inpForceOnRobotGripper.getText()];
            }
        } else if(this.selGripperBrand.getSelectedItem() === "Robotiq Hand-E") {
            if(this.inpWidthRobotiqGripper.getText() =="" || this.inpSpeedRobotiqGripper.getText() == "" || this.inpForceRobotiqGripper.getText() == ""){
                return false;
            } else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), this.inpWidthRobotiqGripper.getText(), this.inpSpeedRobotiqGripper.getText(), this.inpForceRobotiqGripper.getText()];
            }
        } else if(this.selGripperBrand.getSelectedItem() === "Robotiq 2F-85/140") {
            if(this.inpWidthRobotiqGripper.getText() =="" || this.inpSpeedRobotiqGripper.getText() == "" || this.inpForceRobotiqGripper.getText() == ""){
                return false;
            } else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), this.inpWidthRobotiqGripper.getText(), this.inpSpeedRobotiqGripper.getText(), this.inpForceRobotiqGripper.getText()];
            }
        } else if (this.selGripperBrand.getSelectedItem() === "Robotiq AirPick"){
            if(this.selSuctionAction.getSelectedItem() == ""){
                return false;
            } else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), this.selSuctionAction.getSelectedItem()];
            }    
        } else if(this.selGripperBrand.getSelectedItem() === "IO-based gripper") {
            if(this.selConnectionType.getSelectedItem() == "" || this.selGripperOutputOpen.getSelectedItem() == "" || this.selGripperOutputClose.getSelectedItem() == "" || this.selGripperAction.getSelectedItem() == ""){
                return false;
            } else if(this.selGripperOutputOpen.getSelectedItem() == this.selGripperOutputClose.getSelectedItem()){
                return false;
            }else {
                gripperSetting.data = [this.selGripperBrand.getSelectedItem(), this.selConnectionType.getSelectedItem(), this.selGripperOutputOpen.getSelectedItem(), this.selGripperOutputClose.getSelectedItem(), this.selGripperAction.getSelectedItem()];
            }
        } else {
            this.rodiAPI.getUserInteraction().MessageBox.show("ERROR", "Invalid gripper error", 'ERROR', 'OK'); 
            return false; 
        }
        
        settingArray.forEach((value, index) => {
            if(value.name === setting_name) {
                settingArray.splice(index, 1); 
                settingArray.push(gripperSetting);
            }
        });

        this.dataModel.set("gripperSettingList", settingArray);
        this.dataModel.save();
        return true;
    }

    saveProductSettings(setting_name) {
        let settingArray = this.dataModel.get("productSettingList");	// Getting array containing all the product settings from data model

        // Check if product orientation string is filled out correctly
        let posOrientationString = this.inpPosOrientation2.getText();
        let checkString = "0123456789,-";   // Only characters that should be pressent in the string
        let arr = [];
        let i, p;
        
        for(i = 0; i < posOrientationString.length; i++){
           p = checkString.indexOf(posOrientationString[i]); // Check if character is part of allowed collection
           arr.push(p); 
           // Check for every possible faulty entry
           if(p == -1 || (i == 0 && p == 10) || (p == 10 && arr[i-1] == 10) || (p == 11 && arr[i-1] == 11) || (p == 11 && arr[i-1] != 10 && i != 0) || (p == 11 && i == (posOrientationString.length-1)) || (posOrientationString.length == 1 && p == 11 )){
                // If entry is faulty settings are not saved
                return false;
            }
        }

        // Converting string input to array
        let posOrientation2Array = posOrientationString.split(",");
        if(posOrientation2Array == ""){posOrientation2Array = [-1]}

	    // Creating new setting
        let productSetting = {'name': setting_name, 'data': [this.inpProductDeltaX.getText(), this.inpProductDeltaY.getText(), this.inpProductDeltaZ.getText(), this.inpProductWeight.getText(), this.inpOrientation1rx.getText(), this.inpOrientation1ry.getText(), this.inpOrientation1rz.getText(), this.inpOrientation2rx.getText(), this.inpOrientation2ry.getText(), this.inpOrientation2rz.getText(), posOrientation2Array]};

	    // Update new setting in settings array
        settingArray.forEach((value, index) => {
            if(value.name === setting_name) {
                settingArray.splice(index, 1); 		// delete old settings
                settingArray.push(productSetting);	// add new settings
            }
        });
	
	    // update product setting array in data model
        this.dataModel.set("productSettingList", settingArray);
        this.dataModel.save();
        return true;
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	Program node functions

	These functions are used by the program node contribution
*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getGripperSettingList() {
        let gripperSettingArray = this.dataModel.get("gripperSettingList");
        
        return gripperSettingArray;
    }

    getGridSettingList() {
        let gridSettingArray = this.dataModel.get("gridSettingList");
        
        return gridSettingArray;
    }

    getProductSettingList() {
        let productSettingArray = this.dataModel.get("productSettingList");
        
        return productSettingArray;
    }

    getCalibrationPose() {
        let calibrationPoseLeft = this.dataModel.get("robotCalibrationLeft");
        let calibrationPoseRight = this.dataModel.get("robotCalibrationRight");

        return [calibrationPoseLeft, calibrationPoseRight];
    }

    getAxisOrientation() {
        let axisOrientation = this.dataModel.get("axisOrientation");

        return axisOrientation;
    }

    getRobotiqGripperID() {
        let robotiqGripperID = this.dataModel.get("Robotiq_Gripper_id");

        if(robotiqGripperID === ""){
            return undefined;

        } else{
            return robotiqGripperID;

        }
    }

    getGrippingForce(){
        let grippingForce = this.dataModel.get("Gripping_Force");

        if(grippingForce === ""){
            return undefined;

        } else{
            let grippingForceCalc = (grippingForce / 100) * 255;
            if(grippingForceCalc > 255 || grippingForceCalc < 0){
                return undefined;

            }
            return grippingForceCalc;

        }  
    }

    getGrippingSpeed(){
        let grippingSpeed = this.dataModel.get("Gripping_Speed");

        if(grippingSpeed === ""){
            return undefined;

        } else{
            let grippingSpeedCalc = (grippingSpeed / 100) * 255;
            if(grippingSpeedCalc > 255 || grippingSpeedCalc < 0){
                return undefined;

            }
            return grippingSpeedCalc;

        }
    }

    getCalibrationSide(){
        let calibrationSide = this.dataModel.get("calibration-side");

        if(calibrationSide === ""){
            return undefined;

        } else{
            return calibrationSide;

        }
    }

    // This function creates the arrays with coordinates to be used in the pick and place movements
    createGridCoordinates(gridSettingName,productSettingName){

        // If the robot is not calibrated, no coordinates can be created.
        if(this.dataModel.has("robotCalibrationLeft") == false | this.dataModel.has("robotCalibrationRight") == false ){
            this.rodiAPI.getUserInteraction().MessageBox.show('Calibration error', 'No calibration file found, please calibrate the robot.', 'ERROR', 'OK');
            return;
        }

        // Defining variables
        let calibrationPoseLeft = this.dataModel.get("robotCalibrationLeft");
        let calibrationPoseRight = this.dataModel.get("robotCalibrationRight")
        let axisOrientation = this.dataModel.get("axisOrientation");
        let gridSettingList = this.dataModel.get("gridSettingList");
        let productSettingList = this.dataModel.get("productSettingList");
        let gridSettings, productSettings, theta;
        
        // If the robot has not been properly calibrated (right side before left side) the program will throw an error.
        if((axisOrientation.direction == "Y") && ((calibrationPoseLeft[0] - calibrationPoseRight[0])*axisOrientation.sign[0] <= 0)){
            this.rodiAPI.getUserInteraction().MessageBox.show('Calibration error', 'Calibration file is incorrect, please recalibrate the robot.', 'ERROR', 'OK');
            return;
        }
        if((axisOrientation.direction == "X") && ((calibrationPoseLeft[1] - calibrationPoseRight[1])*axisOrientation.sign[1] <= 0)){
            this.rodiAPI.getUserInteraction().MessageBox.show('Calibration error', 'Calibration file is incorrect, please recalibrate the robot.', 'ERROR', 'OK');
            return;
        }

        // Calculate offsets for positions based on difference in calibration positions
        if(axisOrientation.direction == "Y"){
            theta = Math.atan(((calibrationPoseLeft[1] - calibrationPoseRight[1])*axisOrientation.sign[1])/((calibrationPoseLeft[0] - calibrationPoseRight[0])*axisOrientation.sign[0]));
        } else if (axisOrientation.direction == "X"){
            theta = Math.atan(((calibrationPoseLeft[0] - calibrationPoseRight[0])*axisOrientation.sign[0])/((calibrationPoseLeft[1] - calibrationPoseRight[1])*axisOrientation.sign[1]));
        }

        // Getting grid settings from list
        gridSettingList.forEach(input => {
            if(input.name == gridSettingName){gridSettings = input.data;}
        })

        productSettingList.forEach(input => {
            if(input.name == productSettingName){productSettings = input.data;}
        })

        // Grid settings: [inpGridDeltaX, inpGridDeltaY, inpGridDeltaZ, inpStartEndX, inpStartEndY, inpStartEndZ, inpProductsX, inpProductsY, inpProductsZ, productsToSkipArray, NoGoZoneX, NoGoZoneY, MaxReachX, MaxReachY]

        let i, p, q;                    // Counter variables for for-loop
        let gridPositionArrayX = [];    // Array that will contain x coordinates
        let gridPositionArrayY = [];    // Array that will contain y coordinates
        let gridPositionArrayZ = [];    // Array that will contain z coordinates
        let curx, cury, curz;           // Variable used in for loop to calculate coordinate before writing to array

        let xSpace = 0;     // Space between each product in x direction
        let ySpace = 0;     // Space between each product in y direction
        let zSpace = 0;     // Space between each product in z direction

        let calibrationToolOffset = 15; // This is the height of the calibration tool

        let delArr = gridSettings[9];

        // Calculate position of first product
        let xStart = calibrationPoseLeft[0] + axisOrientation.offset[0]*axisOrientation.sign[0] - gridSettings[0]*axisOrientation.sign[0] - productSettings[0]*axisOrientation.sign[0];
        let yStart = calibrationPoseLeft[1] + axisOrientation.offset[1]*axisOrientation.sign[1] - gridSettings[1]*axisOrientation.sign[1] - productSettings[1]*axisOrientation.sign[1];
        let zStart = calibrationPoseLeft[2] - calibrationToolOffset + gridSettings[2] + productSettings[2];

        // If there is more then one product in a certain direction the space between each product is calculated
        if(gridSettings[6]>1){xSpace = gridSettings[3]/(gridSettings[6]-1);}
        if(gridSettings[7]>1){ySpace = gridSettings[4]/(gridSettings[7]-1);}
        if(gridSettings[8]>1){zSpace = gridSettings[5]/(gridSettings[8]-1);}

        // Number of products in each direction
        let num_x = gridSettings[6];
        let num_y = gridSettings[7];
        let num_z = gridSettings[8];

        // Limits for robot movement
        let lim_x_min = gridSettings[10];
        let lim_y_min = gridSettings[11]; 
        let lim_x_max = gridSettings[12];
        let lim_y_max = gridSettings[13];

        // Calculating grid coordinates
        let counter = 0;
        if(axisOrientation.direction == "Y"){
            for(i = 0; i < num_z; i++){
                for(p = 0; p < num_y; p++){
                    for(q = 0; q < num_x; q++){
                        // Calculate position relative to table corner
                        let Xdif = xSpace*q*axisOrientation.sign[0];
                        let Ydif = ySpace*p*axisOrientation.sign[1];
                        let Xdif_comp = Math.cos(theta)*Xdif - Math.sin(theta)*Ydif;
                        let Ydif_comp = Math.sin(theta)*Xdif + Math.cos(theta)*Ydif;

                        // Calculate position in robot frame
                        curx = xStart - Xdif_comp;
                        cury = yStart - Ydif_comp;
                        curz = zStart + zSpace*(num_z-(i+1));   // Default setting is to pick the products, hence z direction should run from high to low
                        
                        // If an entry falls outside the reach of the robot it is added to the array of positions to be deleted.
                        if((curx <= lim_x_min && curx >= -1*lim_x_min) && (cury <= lim_y_min && curx >= -1*lim_y_min)){
                            delArr.push(counter);
                        } else if((curx >= lim_x_max) || (curx <= -1*lim_x_max) || (cury >= lim_y_max) || (cury <= -1*lim_y_max)){
                            delArr.push(counter);
                        }
                        
                        // Position is added to the array
                        gridPositionArrayX.push(curx);
                        gridPositionArrayY.push(cury);
                        gridPositionArrayZ.push(curz);
                            
                        counter+=1;
                    }
                }       
            }
        } else if (axisOrientation.direction == "X"){
            for(i = 0; i < num_z; i++){
                for(q = 0; q < num_x; q++){
                    for(p = 0; p < num_y; p++){
                        // Calculate position relative to table corner
                        let Xdif = xSpace*q*axisOrientation.sign[0];
                        let Ydif = ySpace*p*axisOrientation.sign[1];
                        let Xdif_comp = Math.sin(theta)*Ydif + Math.cos(theta)*Xdif;
                        let Ydif_comp = Math.cos(theta)*Ydif - Math.sin(theta)*Xdif;

                        // Calculate position in robot frame
                        curx = xStart - Xdif_comp;
                        cury = yStart - Ydif_comp;
                        curz = zStart + zSpace*(num_z-(i+1))     // Default setting is to pick the products, hence z direction should run from high to low
                        
                        // If an entry falls outside the reach of the robot it is added to the array of positions to be deleted.
                        if((curx <= lim_x_min && curx >= -1*lim_x_min) && (cury <= lim_y_min && curx >= -1*lim_y_min)){
                            delArr.push(counter);
                        } else if((curx >= lim_x_max) || (curx <= -1*lim_x_max) || (cury >= lim_y_max) || (cury <= -1*lim_y_max)){
                            delArr.push(counter);
                        }
                        
                        // Position is added to the array
                        gridPositionArrayX.push(curx);
                        gridPositionArrayY.push(cury);
                        gridPositionArrayZ.push(curz);
                            
                        counter+=1;
                    }
                }       
            }
        }

        // If array with positions to delete is empty it will have a "" as entry, this is erased below
        if(delArr[0]==""){delArr=[];}
        delArr.sort(function(a,b){return b-a});
        
        // Deleting entries of postions that should be skipped
        for(i = 0; i < delArr.length; i++){
	        gridPositionArrayX.splice(delArr[i]-1,1);
	        gridPositionArrayY.splice(delArr[i]-1,1);
            gridPositionArrayZ.splice(delArr[i]-1,1);
        }

        return{gridPositionArrayX, gridPositionArrayY, gridPositionArrayZ};
        
    }
    
}


module.exports = HCT_1200ExtensionNodeContribution;
