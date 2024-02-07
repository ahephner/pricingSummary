import { LightningElement } from 'lwc';
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
import getBestPrice from '@salesforce/apex/getPriceBooks.getBestPrice';
export default class PriceSummaryHolder extends LightningElement {
    acctPriceBooks = [];
    priceBookName;
    listPrice; 
    async newAccountGetPB(event){
        //no double values and assign the standard price book up front; 
        let list = new Set(["01s410000077vSKAAY"])
        let data = await getPriceBooks({accountId: event.detail}); 
        //console.table(this.acctPriceBooks);
        if(data.length>=1 && data != undefined){
            for(let i = 0; i<data.length;i++){
                list.add(data[i].Pricebook2Id);
            }
        }
        this.acctPriceBooks = [...list];
        console.log(this.acctPriceBooks)
    }
    foundPrice = false; 
    async handleSearch(ext){
        let prodId = ext.detail?.product2 ?? 'not found';
        let accId = ext.detail?.accId ?? 'no account';
        let limitAmount = ext.detail?.limitAmount ?? 'no limit'
        let orderBy = ext.detail?.orderBy ?? 'no order'
        if(prodId){
            let data = await getBestPrice({priceBookIds: this.acctPriceBooks, productId: prodId});
            this.priceBookName = data[0].Pricebook2.Name;
            this.listPrice = `$${data[0].UnitPrice}`; 
            this.foundPrice = data != undefined ? true : false; 
         }
    }
}