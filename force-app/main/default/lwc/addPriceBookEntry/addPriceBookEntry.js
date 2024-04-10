import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
export default class AddPriceBookEntry extends LightningModal {
    product2Id;
    @api priceBookId 
    @track newProds = []
    foundProducts = true; 
    handleClear(mess){
        let clearWhat = mess.detail; 
        switch(clearWhat){
            case 'product':
                this.product2Id = '';
                break;
            case 'pricebook':
                this.priceBookId = '';
                break;
            default:
                console.log('not found')
        }
    }

    handleProduct(mess){
        this.product2Id = mess.detail; 
        this.addProduct(); 
    }

    handlePriceBook(mess){
        this.priceBookId = mess.detail; 
    }

    async addProduct(){
        
    }
    handleSave(){    
        this.close('save')
    }

    handleClose(){
        this.close('cancel');
    }
}