import { LightningElement,api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SetIndividualGoal extends LightningElement {
    @api recordId;
    userName;
    userRecordId;

    onUserSelection(event) {
        this.userName = event.detail.selectedValue;
        this.userRecordId = event.detail.selectedRecordId;
    }
    handleSubmit(event){
        event.preventDefault();       
        const fields = event.detail.fields;
        fields.OwnerId = this.userRecordId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess(){
        this.showToast('Goal Created!','SUCCESS','success');
    }

    showToast(message,title,variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

}