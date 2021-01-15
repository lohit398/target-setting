import { LightningElement, api, wire } from 'lwc';
import GET_OPPS from '@salesforce/apex/DE_SalesTargetContoller.getOpps';
import GET_CLOSED_OPPS from '@salesforce/apex/DE_SalesTargetContoller.getClosedOpps';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Goal__c.Id';
import IN_PROGRESS from '@salesforce/schema/Goal__c.In_Progress__c';
import CLOSED from '@salesforce/schema/Goal__c.Target_Reached__c';
import GET_GOAL from '@salesforce/apex/DE_SalesTargetContoller.getGoal';

export default class UpdateFieldInprogress extends LightningElement {
    @api recordId;
    opps;
    amount;
    closedAmount;
    closedOpps;

    //wire methods
    @wire(GET_CLOSED_OPPS, { recordId: '$recordId' })
    wiredClosedData({ error, data }) {
        if (data) {
            this.closedOpps = data;
            let a = 0;
            this.closedOpps.map(item => {
                a = a + item.Amount;
            });
            this.closedAmount = a;
           

            if (this.recordId != undefined) {
                GET_GOAL({ recordId: this.recordId })
                    .then(response => {
                        if (response.Target_Reached__c === undefined || response.Target_Reached__c === null) {
                            var fields = {};
                            console.log(this.closedAmount);
                            fields[ID_FIELD.fieldApiName] = this.recordId;
                            fields[CLOSED.fieldApiName] = this.closedAmount;
                            var recordInput = { fields };
                            updateRecord(recordInput)
                                .then(() => {
                                    console.log('Closed => Updated Successfully')
                                })
                                .catch(error => {
                                    console.log(error);
                                })
                        }

                    })
            }


        }

        else {
            console.log(error)
        }
    }


    @wire(GET_OPPS, { recordId: '$recordId' })
    wiredData({ error, data }) {
        if (data) {
            this.opps = data;
            let a = 0;
            this.opps.map(item => {
                a = a + item.Amount;
            });
            this.amount = a;
            console.log(this.amount);


            var fields = {};
            fields[ID_FIELD.fieldApiName] = this.recordId;
            fields[IN_PROGRESS.fieldApiName] = this.amount;
            var recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    console.log('In -progress => Updated Successfully')
                })
                .catch(error => {
                    console.log(error);
                })
        } else {
            console.log(error)
        }
    }
}