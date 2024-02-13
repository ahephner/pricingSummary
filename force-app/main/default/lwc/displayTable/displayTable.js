import { LightningElement,api, track } from 'lwc';
import getProductPrice from '@salesforce/apex/getPriceBooks.getProductPrice';
import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
import savePBE from '@salesforce/apex/getPriceBooks.savePBE';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
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
    showFooter = false;  
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
                        let dataBack = res.map(x=>{
        
                            return{
                                Id: x.Id,
                                isEdited: false,
                                name: x.Product2.Name.substring(0,30)+ '...',
                                code: x.ProductCode,
                                priceBook: x.Price_Book_Name__c,
                                unitPrice: x.UnitPrice,
                                cost: x.Product_Cost__c,
                                floor: x.Floor_Price__c, 
                                // levelOne: x.Level_1_UserView__c,
                                // levelOneMar: x.Level_One_Margin__c/100,
                                // levelTwo: x.Level_2_UserView__c,
                                // levelTwoMar: x.Level_2_Margin__c/100,
                                Floor_Margin__c: x.Floor_Margin__c,
                                Min_Margin__c: x.Min_Margin__c,
                                readOnly: true,
                                btnText: 'Edit', 
                                btnBrand: 'brand',
                                bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                                pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                            }
                        }); 
                        
                        this.fetchedData = [...dataBack];
                    }
                })
        }else if(this.accountId === ''){
            getProductPrice({productId: this.productId, priceField: this.priceSearchField, orderBy:this.apexOrderBy})
                .then((res)=>{
                    let dataBack = res.map(x=>{
        
                        return{
                            Id: x.Id,
                            isEdited: false,
                            name: x.Product2.Name.substring(0,30)+ '...',
                            code: x.ProductCode,
                            priceBook: x.Price_Book_Name__c,
                            UnitPrice: x.UnitPrice,
                            Product_Cost__c: x.Product_Cost__c,
                            Floor_Price__c: x.Floor_Price__c, 
                            // Level_1_UserView__c: x.Level_1_UserView__c,
                            // Level_One_Margin__c: x.Level_One_Margin__c/100,
                            // Level_2_UserView__c: x.Level_2_UserView__c,
                            // levelTwoMar: x.Level_2_Margin__c/100,
                            Floor_Margin__c: x.Floor_Margin__c/100,
                            Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c/100: x.Min_Margin__c,
                            readOnly: true,
                            btnText: 'Edit', 
                            btnBrand: 'brand',
                            bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                        }
                    }); 
                    this.fetchedData = [...dataBack]; 
                       
                })
        }
     
            this.foundProducts = true;
            this.showFooter = true; 
      
        
 
    }
    // products
    editOne(evt){
        let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
        if(this.fetchedData[index].readOnly === true){
            this.fetchedData[index].readOnly = false;
            this.fetchedData[index].btnText = 'Close';
            this.fetchedData[index].btnBrand = 'destructive'; 
        }else{
            this.fetchedData[index].readOnly = true;
            this.fetchedData[index].btnText = 'Edit';
            this.fetchedData[index].btnBrand = 'brand';
        }
   }

   handleUnitPrice(evt){
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
        this.fetchedData[index].UnitPrice = evt.detail.value;
        this.fetchedData[index].isEdited = true; 
    }
   handleFloor(evt){
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
    this.fetchedData[index].Floor_Price__c = evt.detail.value;
    this.fetchedData[index].isEdited = true; 
    }
   handleFloorMargin(evt){
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
    this.fetchedData[index].Floor_Margin__c = evt.detail.value;
    this.fetchedData[index].isEdited = true; 
   }
   handleMinMargin(evt){
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
    this.fetchedData[index].Min_Margin__c = evt.detail.value;
    this.fetchedData[index].isEdited = true; 
   }

   //need a save
   saveRecords = []
   save(){
    this.foundProducts = false; 
    this.saveRecords = this.fetchedData.filter(x => x.isEdited === true)
    const recordInputs = this.saveRecords.slice().map(draft =>{
        let Id = draft.Id;
        let UnitPrice = draft.UnitPrice;
        //let Min_Margin__c = draft.Min_Margin__c;
        const fields = {Id, UnitPrice}

    return fields;
    })
    savePBE({entries: recordInputs})
    .then((res)=>{
        if(res === 'success'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Ship It!',
                    variant: 'success'
                })
            );
        }
    }).catch(error => {
                console.log(error);
                
                // Handle error
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Margin Error',
                        message: error.body.output.errors[0].message,
                        variant: 'error'
                    })
                )
            }).finally(() => {
                console.log('finally');
                this.foundProducts = true; 
                this.saveRecords = []; 
            });  
   }
//edit all or close all
   editAllBTN = 'Edit All'
    editAll(){
        if(this.editAllBTN === 'Edit All'){
            for(let i = 0; i<this.fetchedData.length; i++){
                this.fetchedData[i].readOnly = false; 
            }
            this.editAllBTN = 'Close All';
        }else{
            for(let i = 0; i<this.fetchedData.length; i++){
                this.fetchedData[i].readOnly = true; 
            }
            this.editAllBTN = 'Edit All';
        }

   }

   applyAll(){

   }
}