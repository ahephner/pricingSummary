import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createSharePrice from '@salesforce/apex/omsOppUpdatePricing.createSharePriceBook';
export default class AddCustomerGroups extends LightningModal {
    @api content
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown noOffSet'
    searchLabel = 'Search Shared Price Books'
    showPriceBooks = true; 
    loaded = true; 
    createNewPriceBook(){
        this.showPriceBooks = false; 
    }
    async createPriceBook(){
            this.loaded = false; 
            let x = this.refs.pbName.value;
            let create = await createSharePrice({name:x}) 
            if(create.includes('success')){
                let mess = create.replace('success ', '')
                //toast does not work in modal
            }else{
                //toast does not work 
                console.error('on create => ', create)
                  
            }
            this.loaded = true; 
            this.showPriceBooks = true;
        }
    cancelPriceBook(){
        this.showPriceBooks = true;
    }
}