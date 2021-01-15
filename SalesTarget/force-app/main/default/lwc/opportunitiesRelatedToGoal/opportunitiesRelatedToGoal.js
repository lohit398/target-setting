import { LightningElement, api, wire } from 'lwc';
import GET_OPPS from '@salesforce/apex/DE_SalesTargetContoller.getOpps';
import { NavigationMixin } from 'lightning/navigation';

const actions = [
    { label: 'Show details', name: 'show_details' }
];

const COLUMNS = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Account', fieldName: 'Account_Name' },
    { label: 'Stage', fieldName: 'StageName', type: 'text' },
    { label: 'Close Date', fieldName: 'CloseDate', type: 'date' },
    { type: 'action', typeAttributes: { rowActions: actions } }
]



export default class OpportunitiesRelatedToGoal extends NavigationMixin(LightningElement) {

    @api recordId;
    opps;
    columns = COLUMNS;

    @wire(GET_OPPS, { recordId: '$recordId' })
    wiredData({ error, data }) {
        if (data) {

            this.opps = JSON.parse(JSON.stringify(data)).map(item => {
                let preparedData = {};
                preparedData.Id = item.Id;
                preparedData.Account_Name = item.Account.Name;
                preparedData.Name = item.Name;
                preparedData.StageName = item.StageName;
                preparedData.CloseDate = item.CloseDate;
                return preparedData;
            });
            //console.log(this.opps);
        }
        else if (error) {
            console.log(error);
            this.data = [];
        }
    }

    handleRowAction(event) {
        let selectedId = event.detail.row.Id;
        console.log(selectedId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: selectedId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            },
        });
    }

}