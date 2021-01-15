import { LightningElement, api, wire } from 'lwc';
import GET_CLOSED_OPPS from '@salesforce/apex/DE_SalesTargetContoller.getClosedOpps';
import { NavigationMixin } from 'lightning/navigation';

const actions = [
    { label: 'Show details', name: 'show_details' }
];

const COLUMNS = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Account', fieldName: 'Account_Name' },
    { label: 'Amount', fieldName: 'Amount', type: 'text' },
    { label: 'Close Date', fieldName: 'CloseDate', type: 'date' },
    { type: 'action', typeAttributes: { rowActions: actions } }
]

//Oppty Name, Account, Amount, Closed Date

export default class GetOppsClosedByTeam extends NavigationMixin(LightningElement) {

    @api recordId;

    opps;
    columns = COLUMNS;

    @wire(GET_CLOSED_OPPS, { recordId: '$recordId' })
    wiredData({ error, data }) {
        if (data) {
            
            this.opps = JSON.parse(JSON.stringify(data)).map(item => {
                let preparedData = {};
                preparedData.Id = item.Id;
                preparedData.Account_Name = item.Account.Name;
                preparedData.Name = item.Name;
                preparedData.Amount = item.Amount;
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
        //console.log(selectedId);
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