import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
import checkPriceBooks from '@salesforce/apex/getPriceBooks.checkPriceBooks';
//STANDARD_PRICEBOOK = '01s410000077vSKAAY'; 
export default class AddPriceBookEntry extends LightningModal {
    product2Id;
    @api priceBookId 
    @track newProds = []
    foundProducts = true; 
    apexOrderBy=''
    handleClear(mess){
        let clearWhat = mess.detail; 
        switch(clearWhat){
            case 'product':
                this.product2Id = '';
                this.template.querySelector('c-product2-look-up').handleClearPBE();
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
        let mess = {detail: 'product'}
        let back = await checkPriceBooks({pricebook: '01s410000077vSKAAY' , productId: this.product2Id, orderBy:this.apexOrderBy })
        let add = await this.addList(back);
        this.handleClear(mess)
    }

    addList(x){
        if(x){
            this.newProds = [
                ...this.newProds,{
                    sObjectType: 'PricebookEntry',
                    Id: '',
                    Pricebook2Id: this.priceBookId,
                    Product2Id: this.product2Id,
                    UnitPrice: x[0].UnitPrice,
                    List_Margin__c: x[0].List_Margin__c,
                    name: x[0].Name,
                    Product_Cost__c: x[0].Product_Cost__c,
                    UseStandardPrice: false,
                    Hold_Margin__c: false,
                    Hold_Rounded_Margin__c: false,
                    IsActive: true,
                    isChanged__c: false,
                    readOnly: true
                }
            ]
        }
    }
    handleSave(){    
        this.close('save')
    }

    handleClose(){
        this.close('cancel');
    }
}