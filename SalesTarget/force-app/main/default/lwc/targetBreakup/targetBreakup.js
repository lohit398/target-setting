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
import CONFIRM_TARGETS from '@salesforce/apex/DE_SalesTargetContoller.confirmTargets';
import TARGET_TO_BE_REACHED from '@salesforce/schema/Goal__c.Target_to_be_reached__c';
import INSERT_CHILD_GOALS from '@salesforce/apex/DE_SalesTargetContoller.insertChildGoals';
import GET_ORG_LEVEL_TARGETS from '@salesforce/apex/DE_SalesTargetContoller.getOrgLevelGoal';
import { getRecord } from 'lightning/uiRecordApi';
import PARENT_RECORD from '@salesforce/schema/Goal__c.Parent_Goal__c';
import UPDATE_PARENT_GOALS from '@salesforce/apex/DE_SalesTargetContoller.updateParentGoals';
import TARGET from '@salesforce/schema/Goal__c.Target_to_be_reached__c';
import GET_CHILD_GOAL from '@salesforce/apex/DE_SalesTargetContoller.getChildGoals';



const fields = [PARENT_RECORD, TARGET];


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


    // Wire methods
    @wire(getObjectInfo, { objectApiName: GOAL__OBJ })
    getRecordTypes({error,data}){
        if(data){
            let recordtypeinfo = data.recordTypeInfos;
            for(let i=0;i< Object.values(recordtypeinfo).length; i++){
                if(Object.values(recordtypeinfo)[i].name === 'Goal Default Record Type'){
                    this.defaultRecordType = Object.keys(recordtypeinfo)[i];
                    console.log(this.defaultRecordType);
                }
            }
        }
        else{
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
        }
        else if (error) {
            console.log(error);
        }
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