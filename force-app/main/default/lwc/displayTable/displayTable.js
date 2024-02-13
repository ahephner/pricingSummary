import { LightningElement,api, track } from 'lwc';
import getProductPrice from '@salesforce/apex/getPriceBooks.getProductPrice';
import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
export default class DisplayTable extends LightningElement {
     prods; 
    @api productId;
    @api accountId
    @api limitedSearchRes
    @api orderSearchBy
    @api primaryCat
    @api priceSearchField
    @api apexOrderBy
    @api accountpricebooks
    foundProducts = true; 
    @track fetchedData = []; 
    @api iAmSpinning(){
        this.foundProducts = false; 
    }
    //get product info 
    @api loadProds(){
         
        if(this.accountId != ''){
            getBestPriceString({priceBooksAcc: this.accountpricebooks, priceField: this.priceSearchField, productId:this.productId, orderBy:this.apexOrderBy  })
                .then((res)=>{
                    if(res){
                        this.fetchedData = res.map(x=>{
        
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
                        console.log(this.fetchedData)
                    }
                })
        }else if(this.accountId === ''){
            getProductPrice({productId: this.productId, priceField: this.priceSearchField, orderBy:this.apexOrderBy})
                .then((res)=>{
                    this.fetchedData = res.map(x=>{
        
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
                    console.log(this.fetchedData)
                    this.foundProducts = true;   
                })
        }
 
    }
    // products
    editOne(evt){
        let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
        console.log(index)
        this.fetchedData[index].readOnly = false; 
   }
}