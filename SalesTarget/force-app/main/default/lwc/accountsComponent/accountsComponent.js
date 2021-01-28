import { LightningElement, api, wire } from 'lwc';
import getGoal from '@salesforce/apex/DE_SalesTargetContoller.getGoal';
import getAccountsByOwner from '@salesforce/apex/DE_SalesTargetContoller.getAccountsByOwner';
import TARGET from '@salesforce/schema/Account.Target__c';
import ID_FIELD from '@salesforce/schema/Account.Id';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const col = [
    { label: 'Account Name', fieldName: 'Name' },
    { label: 'Account Target', fieldName: 'Target__c', type: 'currency', editable: true }
];

export default class AccountsComponent extends LightningElement {
    @api recordId;
    __ownerId;
    columns = col;
    draftValues= [];



    @wire(getGoal, { recordId: '$recordId' })
    getDetails({ error, data }) {
        if (error)
            console.log(error);
        else if (data) {
            this.__ownerId = data.OwnerId;  
        }
    }

    @wire(getAccountsByOwner, { ownerId: '$__ownerId' })
    accounts;

    handleSave(event) {
        
        let promisesArray = [];
        promisesArray = JSON.parse(JSON.stringify(event.detail.draftValues)).map(item => {
            let fields = {};
            fields[ID_FIELD.fieldApiName] = item.Id;
            fields[TARGET.fieldApiName] = item.Target__c;
            console.log(item.Target__c);
            let recordInput = { fields };
            return updateRecord(recordInput);
        })

        Promise.all(promisesArray)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account Target updated',
                        variant: 'success'
                    })
                );

                return refreshApex(this.accounts).then(() => {
                    this.draftValues = [];

                });
            })
    }
}