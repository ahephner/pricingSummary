import { LightningElement } from 'lwc';
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
import getProductPrice from '@salesforce/apex/getPriceBooks.getProductPrice';
import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
export default class PriceSummaryHolder extends LightningElement {
    acctPriceBooks = [];
    fetchedData = {};
    priceBookName;
    listPrice; 
    foundProducts = false;
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
        //console.log(this.acctPriceBooks)
    }
    priceField; 
    foundPrice = false; 
    async handleSearch(ext){
        let prodId = ext.detail?.product2 ?? '';
        let accId = ext.detail?.accId ?? '';
        let limitAmount = ext.detail?.limitAmount ?? ''; 
        let orderBy = ext.detail?.orderBy ?? '';
        let primCat = ext.detail?.primCat ?? '';
        this.priceField = ext.detail?.priceField ?? 'error';
 
        let apexOrderBy = orderBy != 'none'? ' ORDER BY '+this.priceField +' '+orderBy+'' : ' ORDER BY '+ this.priceField +' ASC';
        
        if(accId != ''){
            let back = await getBestPriceString({priceBooksAcc: this.acctPriceBooks, priceField: this.priceField, productId:prodId,orderBy:apexOrderBy  })
            if(back){
                this.fetchedData = back.map(x=>{
        
                    return{
                        Id: x.Id,
                        name: x.Product2.Name.substring(0,30)+ '...',
                        code: x.ProductCode,
                        priceBook: x.Price_Book_Name__c,
                        unitPrice: x.UnitPrice,
                        cost: x.Product_Cost__c,
                        floor: x.Floor_Price__c, 
                        levelOne: x.Level_1_UserView__c,
                        levelOneMar: x.Level_One_Margin__c/100,
                        levelTwo: x.Level_2_UserView__c,
                        levelTwoMar: x.Level_2_Margin__c/100,
                        readOnly: true,
                        bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                        pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                    }
                }); 
                
                this.foundProducts = true;   
            }
        }else if(accId === ''){
            let back = await getProductPrice({productId:prodId, priceField: this.priceField, orderBy:apexOrderBy});
            if(back){
                this.fetchedData = back.map(x=>{
        
                    return{
                        Id: x.Id,
                        name: x.Product2.Name.substring(0,30)+ '...',
                        code: x.ProductCode,
                        priceBook: x.Price_Book_Name__c,
                        unitPrice: x.UnitPrice,
                        cost: x.Product_Cost__c,
                        floor: x.Floor_Price__c, 
                        levelOne: x.Level_1_UserView__c,
                        levelOneMar: x.Level_One_Margin__c/100,
                        levelTwo: x.Level_2_UserView__c,
                        levelTwoMar: x.Level_2_Margin__c/100,
                        readOnly: true,
                        bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                        pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                    }
                }); 
                
                this.foundProducts = true;   
            }
        }

    }

    handleOpen(evt){
        let index = evt.target.name; 
        this.fetchedData[index].readOnly = false; 
    }

}