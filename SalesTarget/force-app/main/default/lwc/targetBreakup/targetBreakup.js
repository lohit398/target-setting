import { LightningElement, api, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import GOAL__OBJ from '@salesforce/schema/Goal__c';
import GOAL_PERIOD from '@salesforce/schema/Goal__c.Goal_Period__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import GET_USERS from '@salesforce/apex/DE_SalesTargetContoller.getUsers';
import { getResultsQuarter, validateTargets, setSum, fillData, disableFields } from 'c/targetBreakupHelper';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Goal__c.Id';
import NAME_FIELD from '@salesforce/schema/Goal__c.Name';
import CONFIRM_TARGETS from '@salesforce/apex/DE_SalesTargetContoller.confirmTargets';
import TARGET_TO_BE_REACHED from '@salesforce/schema/Goal__c.Target_to_be_reached__c';
import INSERT_CHILD_GOALS from '@salesforce/apex/DE_SalesTargetContoller.insertChildGoals';
import GET_ORG_LEVEL_TARGETS from '@salesforce/apex/DE_SalesTargetContoller.getOrgLevelGoal';
import { getRecord } from 'lightning/uiRecordApi';
import PARENT_RECORD from '@salesforce/schema/Goal__c.Parent_Goal__c';
import UPDATE_PARENT_GOALS from '@salesforce/apex/DE_SalesTargetContoller.updateParentGoals';
import TARGET from '@salesforce/schema/Goal__c.Target_to_be_reached__c';
import GET_CHILD_GOAL from '@salesforce/apex/DE_SalesTargetContoller.getChildGoals';
import getProductFamilies from '@salesforce/apex/DE_SalesTargetContoller.getProductFamilies';
import getAreas from '@salesforce/apex/DE_SalesTargetContoller.getAreas';
import TARGET_TYPE from '@salesforce/schema/Goal__c.Target_Type__c';
import { createRecord } from 'lightning/uiRecordApi';
import Financial_Year__c from '@salesforce/schema/Goal__c.Financial_Year__c';
import Type__c from '@salesforce/schema/Goal__c.Type__c';
import getProductFamilyChildGoals from '@salesforce/apex/DE_SalesTargetContoller.getProductFamilyChildGoals';
import getAreaChildGoals from '@salesforce/apex/DE_SalesTargetContoller.getAreaChildGoals';
import Family_Area_Name__c from '@salesforce/schema/Goal__c.Family_Area_Name__c';


const fields = [PARENT_RECORD, TARGET, Financial_Year__c];


export default class TargetBreakup extends LightningElement {

    @api recordId;
    options = [];
    value;
    goalPeriod = "Financial Year";
    target;
    users = [];
    quarters = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
    targetGoalPeriod = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
    userTargets = [];
    quarterTargets = [];
    isInitialized = true;
    isParent;
    hasreportees;
    isTargetsConfirmed = false;
    presetTargets = {};
    defaultRecordType;
    productFamilies = [];
    targetsForFamilies = [];
    areas = [];
    targetForAreas = [];
    finacialYear;
    presetAreaTargets = {};
    presetFamilyTargets = {};


    // Wire methods
    @wire(getObjectInfo, { objectApiName: GOAL__OBJ })
    getRecordTypes({ error, data }) {
        if (data) {
            let recordtypeinfo = data.recordTypeInfos;
            for (let i = 0; i < Object.values(recordtypeinfo).length; i++) {
                if (Object.values(recordtypeinfo)[i].name === 'Goal Default Record Type') {
                    this.defaultRecordType = Object.keys(recordtypeinfo)[i];
                    //console.log(this.defaultRecordType);
                }
            }
        }
        else {
            console.log(error);
        }

    }


    @wire(getPicklistValues, { recordTypeId: '$defaultRecordType', fieldApiName: GOAL_PERIOD })
    wiredData({ error, data }) {
        if (data) {
            this.options = data.values.map((item, index) => {
                let obj = {};
                obj.label = item.label;
                obj.value = item.value;
                if (index === 0) {
                    this.value = item.value;
                }
                return obj;
            });
        }
        else {
            console.log(error);
        }

    }



    @wire(getRecord, { recordId: '$recordId', fields: fields })
    wireRecordData({ error, data }) {
        if (data) {
            this.isParent = data.fields.Parent_Goal__c.value === null ? true : false;
            this.finacialYear = data.fields.Financial_Year__c.value;
        }
        else if (error) {
            console.log(error);
        }
    }

    @wire(getProductFamilies)
    getProductFamilies({ error, data }) {
        if (error) {
            console.log(error);
        } else if (data) {
            this.productFamilies = data;
            //console.log(data);
        }
    }

    @wire(getAreas)
    getAreasDetails({ error, data }) {
        if (error)
            console.log(error);
        else if (data)
            this.areas = data;
    }


    // lifecycle hooks
    connectedCallback() {
        /* create a field confirmed targets which makes things easy, which will be checked once the targets are submitted and then use connected callback*/
        GET_USERS({ recordId: this.recordId })
            .then(response => {

                this.users = response;
                this.hasreportees = this.users.length > 0 ? true : false;
                return GET_ORG_LEVEL_TARGETS({ recordId: this.recordId })
            })
            .then(response => {
                this.target = response.Target_to_be_reached__c;
                this.goalPeriod = response.Goal_Period__c;
                this.value = this.goalPeriod;
                this.isTargetsConfirmed = response.Targets_Confirmed__c;

                GET_CHILD_GOAL({ recordId: this.recordId })
                    .then(response => {
                        JSON.parse(JSON.stringify(response)).map(item => {
                            this.presetTargets[item.OwnerId] = item.Target_to_be_reached__c;
                        })

                        if (this.target != undefined)
                            this.handleTargetChange();
                    }).catch(error => {
                        console.log(error);
                    })

                getAreaChildGoals({ recordId: this.recordId })
                    .then(response => {
                        JSON.parse(JSON.stringify(response)).map(item => {
                            this.template.querySelector('[data-areaname="' + item.Name.split('-')[1].trim() + '"]').value = item.Target_to_be_reached__c;
                        })
                    })
                getProductFamilyChildGoals({ recordId: this.recordId })
                    .then(response => {
                        JSON.parse(JSON.stringify(response)).map(item => {
                            this.template.querySelector('[data-productfamily="' + item.Name.split('-')[1].trim() + '"]').value = item.Target_to_be_reached__c;
                        })
                    })

            })
            .catch(error => {
                this.users = [];
                console.log(error);
            })
    }



    // Handlers   
    handleChange(event) {
        this.targetGoalPeriod = [];
        this.goalPeriod = event.target.value;
        getResultsQuarter(this);
    }

    handleTargetChange(event) {
        this.targetGoalPeriod = [];

        event != null || event != undefined ? this.target = event.target.value : '';

        fillData(this);

        if ((event === null || event === undefined)) {
            disableFields(this.isParent, this.isTargetsConfirmed, this);
        }
        setSum(this);
    }

    createGoals() {
        if (this.validate()) {
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.recordId;
            fields[GOAL_PERIOD.fieldApiName] = this.goalPeriod;
            fields[TARGET_TO_BE_REACHED.fieldApiName] = this.target;
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.createChildGoals();
                })
                .catch(error => {
                    this.showErrorToast(error, 'Error', 'error');
                })
        }
    }

    createChildGoals() {
        if (this.validate()) {
            this.insertChildGoals() /*Create Child Goals*/
                .then((response) => {
                    return UPDATE_PARENT_GOALS({ insertedGoals: response }) /*Update child goals to point to the parent goal*/
                })
                .then(() => {
                    return CONFIRM_TARGETS({ recordId: this.recordId }); /*Update targets confirmed fields*/
                })
                .then(() => {
                    this.isTargetsConfirmed = true;
                    disableFields(this.isParent, this.isTargetsConfirmed, this);
                    this.showErrorToast('Successfully Updated the target value of Goal!', 'Success', 'success');
                })
                .catch(error => {
                    console.log(error);
                    this.showErrorToast(error, 'Error', 'error');
                })
        }
    }


    insertChildGoals() {

        let uTargets = [];
        uTargets = this.userTargets.map((item) => {
            return item.target;
        })

        let users = this.users.map(item => {
            return item.Id;
        })

        return INSERT_CHILD_GOALS({
            parentGoalId: this.recordId,
            users: users,
            targets: uTargets
        })
    }



    handleChangeUserTargets(event) {
        //console.log(event.target.value);
        this.userTargets = this.userTargets.map(item => {
            if (Object.values(item)[0] === event.target.dataset.userid) {
                let obj = {};
                obj.userId = Object.values(item)[0];
                obj.target = parseFloat(event.target.value);
                return obj;
            }
            else
                return item;
        });

        setSum(this);
    }
    handleChangeInQuarterTargets(event) {
        this.quarterTargets = this.quarterTargets.map(item => {
            if (Object.keys(item)[0] === event.target.dataset.quarter) {
                let obj = {};
                obj[Object.keys(item)[0]] = parseFloat(event.target.value);
                return obj;
            }
            else
                return item;
        })
    }

    showErrorToast(message, title, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    /*product family targets are created and taken based on */
    handleProductTargetsCreation() {
        this.targetsForFamilies = this.targetsForFamilies.filter(item => {
            return item.target != 0;
        })

        let createPromises = this.targetsForFamilies.map(item => {
            let fields = {};
            fields[NAME_FIELD.fieldApiName] = 'Product Target - ' + item.family;
            fields[TARGET_TO_BE_REACHED.fieldApiName] = parseFloat(item.target);
            fields[TARGET_TYPE.fieldApiName] = 'Revenue';
            fields[Financial_Year__c.fieldApiName] = this.finacialYear;
            fields[PARENT_RECORD.fieldApiName] = this.recordId;
            fields[Type__c.fieldApiName] = 'Product Family';
            fields[Family_Area_Name__c.fieldApiName] = item.family;
            const recordInput = { apiName: GOAL__OBJ.objectApiName, fields };
            return createRecord(recordInput);
        })
        Promise.all(createPromises)
            .then(values => {
                this.template.querySelectorAll("[data-fieldtype='productfamily']").forEach(element => {
                    element.disabled = true;
                });
                this.template.querySelector('[data-buttontype="product_family"]').disabled = true;
            })
            .catch(error => {
                console.log(error);
            })
    }

    /*tracks changes in product family percentages*/
    handleChangeFamily(event) {
        let family = event.target.dataset.productfamily;
        let found = 0;

        this.targetsForFamilies = this.targetsForFamilies.map(item => {
            if (item.family === family) {
                found = 1;
                let obj = {};
                obj.family = family;
                obj.target = (parseInt(event.target.value / 100)) * this.target;
                return obj;
            }
            else
                return item;
        })

        if (found === 0) {
            let new_obj = {};
            new_obj.family = family;
            new_obj.target = (parseInt(event.target.value) / 100) * this.target;
            this.targetsForFamilies.push(new_obj);
        }
    }

    handleAreaTargetChange(event) {
        let area = event.target.dataset.areaname;
        let found = 0;
        this.targetForAreas = this.targetForAreas.map(item => {
            if (item.area === area) {
                found = 1;
                let obj = {};
                obj.area = area;
                obj.target = (parseInt(event.target.value / 100)) * this.target;
                return obj;
            }
            else
                return item;
        })

        if (found === 0) {
            let new_obj = {};
            new_obj.area = area;
            new_obj.target = (parseInt(event.target.value) / 100) * this.target;
            this.targetForAreas.push(new_obj);
        }
    }

    handleAreaTargetCreation() {
        this.targetForAreas = this.targetForAreas.filter(item => {
            return item.target != 0;
        })
        //console.log(this.targetForAreas);
        let createPromises = this.targetForAreas.map(item => {
            let fields = {};
            fields[NAME_FIELD.fieldApiName] = 'Area Target - ' + item.area;
            fields[TARGET_TO_BE_REACHED.fieldApiName] = parseFloat(item.target);
            fields[TARGET_TYPE.fieldApiName] = 'Revenue';
            fields[Financial_Year__c.fieldApiName] = this.finacialYear;
            fields[PARENT_RECORD.fieldApiName] = this.recordId;
            fields[Type__c.fieldApiName] = 'Area';
            fields[Family_Area_Name__c.fieldApiName] = item.area;
            const recordInput = { apiName: GOAL__OBJ.objectApiName, fields };
            return createRecord(recordInput);
        })
        Promise.all(createPromises)
            .then(values => {
                this.template.querySelectorAll("[data-fieldtype='area']").forEach(element => {
                    element.disabled = true;
                });
                this.template.querySelector('[data-buttontype="area_targets"]').disabled = true;
            })
            .catch(error => {
                console.log(error);
            })

    }


    /*Support Functions */

    validate() {
        let uTargets = [];
        let qTargets = [];
        uTargets = this.userTargets.map((item) => {
            return item.target;
        })
        //console.log(uTargets);
        qTargets = this.quarterTargets.map(item => {
            return Object.values(item)[0];
        })

        let error = validateTargets(uTargets, qTargets, this.target);

        if (error.length === 2) {
            this.showErrorToast('Sum (Regional Heads and the Quarters) is not equal to TotalTarget', 'Error', 'error');
            return false;
        }
        else if (error.length === 1) {
            if (error[0].includes('Quarter')) {
                this.showErrorToast('Sum (Quarters) is not equal to TotalTarget', 'Error', 'error');
                return false;
            }
            else {
                this.showErrorToast('Sum (Regional Heads) is not equal to TotalTarget', 'Error', 'error');
                return false;
            }
        }
        else
            return true;
    }

}