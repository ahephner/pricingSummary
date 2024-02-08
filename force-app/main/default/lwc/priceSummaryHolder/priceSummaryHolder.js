import { LightningElement } from 'lwc';
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
import getBestPrice from '@salesforce/apex/getPriceBooks.getBestPrice';
import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
export default class PriceSummaryHolder extends LightningElement {
    acctPriceBooks = [];
    fetchedData = {};
    priceBookName;
    listPrice; 
    async newAccountGetPB(event){
        //no double values and assign the standard price book up front; 
        let list = new Set(["01s410000077vSKAAY"])
        //let list = new Set(); 
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
        let prodId = ext.detail?.product2 ?? '';
        let accId = ext.detail?.accId ?? '';
        let limitAmount = ext.detail?.limitAmount ?? ''; 
        let orderBy = ext.detail?.orderBy ?? '';
        let primCat = ext.detail?.primCat ?? '';
        let priceField = ext.detail?.priceField ?? 'error';
 
        let apexOrderBy = orderBy != 'none'? ' ORDER BY '+priceField +' '+orderBy+'' : ' ORDER BY '+ priceField +' ASC';
        
        
       
         
        let back = await getBestPriceString({priceBooksAcc: this.acctPriceBooks, priceField: priceField, productId:prodId,orderBy:apexOrderBy  })

        //this.fetchedData = {info: back};
        this.fetchedData = priceField;  
        console.log(this.fetchedData)
        // if(prodId){
        //     let data = await getBestPrice({priceBookIds: this.acctPriceBooks, productId: prodId});
        //     this.priceBookName = data[0].Pricebook2.Name;
        //     this.listPrice = `$${data[0].UnitPrice}`; 
        //     this.foundPrice = data != undefined ? true : false; 
        //  }
    }
}