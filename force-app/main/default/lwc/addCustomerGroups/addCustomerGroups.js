import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import createSharePrice from '@salesforce/apex/omsOppUpdatePricing.createSharePriceBook';
export default class AddCustomerGroups extends LightningModal {
    @api content
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown noOffSet'
    searchLabel = 'Search Shared Price Books'
    showPriceBooks = true; 
    createNewPriceBook(){
        this.showPriceBooks = false; 
    }
    async createPriceBook(){
            let x = this.refs.pbName.value;
            let create = await createSharePrice({name:x}) 
            console.log(create); 
            this.showPriceBooks = true;
        }
    cancelPriceBook(){
        this.showPriceBooks = true;
    }
}