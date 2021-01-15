import {
    LightningElement,
    track,
    api
} from 'lwc';
import createGol from "@salesforce/apex/LwcLookupController.createGoal";

export default class GoalForm extends LightningElement {

    @track userName;
    @track userRecordId;
    amount = 5;
    @api recordId;
    onUserSelection(event) {
        this.userName = event.detail.selectedValue;
        this.userRecordId = event.detail.selectedRecordId;
    }

    handleChange(event) {
        this.amount = event.target.value;
    }

    handleClick() {
        console.log(this.amount + '\t' + this.userRecordId);
        var createGoal = {};
        createGoal.object = 'Goal__c';
        createGoal.OwnerId = this.userRecordId;
        createGoal.Financial_Year__c = 'a7j3t000001HspWAAS';
        createGoal.Target_Type__c = 'a7i3t000000g3MYAAY';
        createGoal.Parent_Goal__c = this.recordId;
        createGol({
                goal: createGoal
            }).then(res => console.log(res))
            .catch(err => console.log(err));
    }
}