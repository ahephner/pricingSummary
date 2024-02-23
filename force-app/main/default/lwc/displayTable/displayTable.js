import { LightningElement,api, track } from 'lwc';
import getProductPrice from '@salesforce/apex/getPriceBooks.getProductPrice';
import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
import savePBE from '@salesforce/apex/getPriceBooks.savePBE';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {roundNum} from 'c/programBuilderHelper';
import ApplyAllModal from 'c/applyAllModal';
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
    enforceFloor = false;
    averageUnitPrice = 0; 
    averageMarginUp = 0;
    productCost; 
    @track fetchedData = []; 
    @api iAmSpinning(){
        this.foundProducts = false; 
    }
    //get product info 
    //send averages back home
    @api loadProds(){
         
        if(this.accountId != ''){
            getBestPriceString({priceBooksAcc: this.accountpricebooks, priceField: this.priceSearchField, productId:this.productId, orderBy:this.apexOrderBy  })
                .then((res)=>{
                    if(res){
                        let dataBack = res.map(x=>{
        
                            return{
                                Id: x.Id,
                                isEdited: false,
                                updateProd2: false,
                                canEdit: x.Pricebook2Id === '01s410000077vSKAAY' ? false: true,
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
                                Floor_Margin__c: x.Floor_Margin__c,
                                Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                                Product2Id: x.Product2Id,
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
        //check if there is a floor margin if no set at 30; 
                        return{
                            Id: x.Id,
                            isEdited: false,
                            updateProd2: false, 
                            canEdit: x.Pricebook2Id === '01s410000077vSKAAY' ? false: true,
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
                            Floor_Margin__c: x.Floor_Margin__c,
                            Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                            readOnly: true,
                            Product2Id: x.Product2Id,
                            btnText: 'Edit', 
                            btnBrand: 'brand',
                            bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                        }
                    }); 
                    this.fetchedData = [...dataBack]; 
                       
                }).then((x)=>{
                   this.productCost = this.fetchedData[0]?.Product_Cost__c ?? 0; 
                   this.alertPriceUpdate(); 
                })
        }
     
            this.foundProducts = true;
            this.showFooter = true; 
      
        
 
    }
    handleEnforce(evt){
        this.enforceFloor = evt.target.checked; 
        console.log('enforcefloor ', this.enforceFloor)
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
    window.clearTimeout(this.delay);
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
        this.delay = setTimeout(()=>{
            this.fetchedData[index].UnitPrice = evt.detail.value;
            this.fetchedData[index].isEdited = true;
            if(this.fetchedData[index].UnitPrice > 0){
                //maintain floor margin
                    if(this.enforceFloor){
                        this.fetchedData[index].updateProd2 = true; 
                        this.fetchedData[index].Floor_Price__c = roundNum((this.fetchedData[index].UnitPrice/(1 - this.fetchedData[index].Floor_Margin__c)),2);
                    }
                    
            }
        },800)
    }
   handleFloor(evt){
    window.clearTimeout(this.delay);
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name); 
    this.delay = setTimeout(()=>{
        this.fetchedData[index].Floor_Price__c = evt.detail.value;
        this.fetchedData[index].isEdited = true; 

        if(this.fetchedData[index].UnitPrice > 0){
            this.fetchedData[index].updateProd2 = true; 
            this.fetchedData[index].Floor_Margin__c = roundNum((1-(this.fetchedData[index].Product_Cost__c/this.fetchedData[index].Floor_Price__c)),2);
            this.fetchedData[index].Min_Margin__c = this.fetchedData[index].Floor_Margin__c; 
        }
    },800)
    }
   handleFloorMargin(evt){
    window.clearTimeout(this.delay);
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
    console.log(evt.detail.value)
    this.fetchedData[index].Floor_Margin__c = evt.detail.value;
    
    this.delay = setTimeout(()=>{
        this.fetchedData[index].isEdited = true; 
        this.fetchedData[index].updateProd2 = true; 
        this.fetchedData[index].Floor_Price__c = roundNum(this.fetchedData[index].Product_Cost__c/(1- (this.fetchedData[index].Floor_Margin__c/100)), 2); 
        this.fetchedData[index].Min_Margin__c = this.fetchedData[index].Floor_Margin__c 
    },800)
   }
   handleMinMargin(evt){ 
    window.clearTimeout(this.delay); 
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
    this.fetchedData[index].Min_Margin__c = evt.detail.value;

    this.delay = setTimeout(()=>{
        this.fetchedData[index].isEdited = true; 
        this.fetchedData[index].Floor_Price__c = roundNum(this.fetchedData[index].Product_Cost__c/(1- (this.fetchedData[index].Min_Margin__c/100)), 2); 
        this.fetchedData[index].updateProd2 = true; 
        if(this.fetchedData[index].Min_Margin__c>this.fetchedData[index].Floor_Margin__c){
            this.fetchedData[index].Floor_Margin__c = this.fetchedData[index].Min_Margin__c; 
        }
    })
   }

   //need a save
   saveRecords = [];
   product = [];
   save(){
    this.foundProducts = false; 
    this.saveRecords = this.fetchedData.filter(x => x.isEdited === true)
    this.product = this.fetchedData.filter(x=> x.updateProd2 === true)
    const recordInputs = this.saveRecords.slice().map(draft =>{
        let Id = draft.Id;
        let UnitPrice = draft.UnitPrice;
        let Min_Margin__c = draft.Min_Margin__c;
        const fields = {Id, UnitPrice, Min_Margin__c}

    return fields;
    })

    const product2Id = this.product.slice().map(draft=>{
        let Id = draft.Product2Id;
        let Floor_Price__c = draft.Floor_Price__c
        const fields =  {Id, Floor_Price__c};
        
    return fields; 
    })
    savePBE({entries: recordInputs, products: product2Id})
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
                
                //I need to also uncheck the products that are isChanged === true; 
                this.saveRecords = [];
                this.product = [];
                for(let i = 0; i<this.fetchedData.length;i++){
                    this.fetchedData[i].isEdited = false;
                    this.fetchedData[i].updateProd2 = false; 
                    this.fetchedData[i].readOnly = true; 
                    this.fetchedData[i].btnText = 'Edit', 
                    this.fetchedData[i].btnBrand ='brand'
                } 
                this.foundProducts = true; 
                
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

   async applyAll(){
    const result = await ApplyAllModal.open({
        size: 'medium',
        description: 'Accessible description of modal\'s purpose',
        content: 'Passed into content api',
        averageMarginUp: this.averageMarginUp,
        averageUnitPrice: this.averageUnitPrice,
        productCost: this.productCost,
        fetchedData: this.fetchedData 
    })
    .then((result)=>{
        //console.log(result)
        if(result!= undefined && result !='cancel'){
            this.fetchedData = [...result];  
            this.save()
            
        }
    }) 
   }

   //math functions; 
   getAverage(arr){
    let numb = arr.reduce((total, next)=> total + next.UnitPrice,0)/arr.length;
    return numb; 
   }

   marginCalc(cost, price, returnDecimalBoolean){
    let margin = (price - cost)/price;
    if(returnDecimalBoolean){
        return margin
    }else{
        return (margin * 100); 
    }
   }


   //update the priceInfo component
   alertPriceUpdate(){
    this.averageUnitPrice = roundNum(this.getAverage(this.fetchedData),2);
    //cost shuold be same across board 
    //price can be anything here using average
    //returnDecimalBoolean true/false do you want full number or dec.  
    this.averageMarginUp = roundNum(this.marginCalc(this.productCost, this.averageUnitPrice, false),2)
    
    const averages = new CustomEvent('newaverage',{
        detail:{
            unitprice: this.averageUnitPrice,
            margins: this.averageMarginUp
        }
    })

    this.dispatchEvent(averages);
   }
}