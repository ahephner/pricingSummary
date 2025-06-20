import { LightningElement,api, track } from 'lwc';
import getProductPrice from '@salesforce/apex/getPriceBooks.getProductPrice';
//best price 
//import getBestPriceString from '@salesforce/apex/getPriceBooks.getBestPriceString';
//priority price
import allPriceBooks from '@salesforce/apex/getPriceBooks.allPriceBooks';
import getCounterUpdates from '@salesforce/apex/getPriceBooks.getCounterUpdates';
import checkPriceBooks from '@salesforce/apex/getPriceBooks.checkPriceBooks';
import savePBE from '@salesforce/apex/getPriceBooks.updatePBE';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord} from 'lightning/uiRecordApi';
import {roundNum} from 'c/programBuilderHelper';
import ApplyAllModal from 'c/applyAllModal';
//import{ refreshApex } from '@salesforce/apex';
export default class DisplayTable extends LightningElement {
    minMargeInfo = 'Last margin sold or set by rep'; 
    calMargInfo = 'Current Cost Margin is Calculated with LPP/List Price and Today’s Cost';
    filterInfo = 'Filters based on products in your price book. Only avaliable when searching single price book'; 
    prods; 
    @api productId;
    @api accountId
    @api priceBookId; 
    @api limitedSearchRes
    @api orderSearchBy
    @api primaryCat
    @api priceSearchField
    @api apexOrderBy
    @api accountpricebooks
    groupedData; 
    foundProducts = true;
    showFooter = false;
    accBased = false;   
    enforceFloor = false;
    averageUnitPrice = 0; 
    averageMarginUp = 0;
    productCost;
    initLoad = false;  
    userInform; 
    changesMade = false; 
    badPricing  = false;
    hasRendered = false;  
    @track gathered = []
    @track fetchedData = []; 
    @track options = []; 
    @api iAmSpinning(){
        this.foundProducts = false; 
    }

    renderedCallback(){
        if(this.fetchedData.length>0 && this.hasRendered){
            this.initPriceCheck(); 
        }
    }
    //get product info 
    //send averages back home
    @api loadProds(){
        if(this.priceBookId != ''){
            checkPriceBooks({pricebook: this.priceBookId, productId: this.productId, orderBy:this.apexOrderBy })
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
                            List_Margin__c: x.List_Margin__c,
                            Hold_Margin__c: x.Hold_Margin__c,
                            List_Margin_Calculated__c: x.List_Margin_Calculated__c,
                            // levelTwoMar: x.Level_2_Margin__c/100,
                            Floor_Margin__c: x.Floor_Margin__c,
                            Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                            Product2Id: x.Product2Id,
                            goodPrice: x.Floor_Price__c <= x.UnitPrice? true:false,
                            sub: x.Sub_Cat__c,
                            readOnly: true,
                            btnText: 'Edit', 
                            btnBrand: 'brand',
                            bookURL: `https://advancedturf.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            pbeURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${x.Id}/view`
                            //bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            //pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                        }
                    }); 
                    this.groupedData = Object.groupBy(dataBack, ({sub})=> sub);
                    
                    for(const [key] of Object.entries(this.groupedData)){
                        let pair = {label:key, value:key} 
                        this.options.push(pair)
                      this.gathered.push(...this.groupedData[key])
                    }
                    
                    this.fetchedData = [...this.gathered];
                    this.accBased = true; 
                    this.userInform = 'Searching Single Price Book'
                }
            }).then((x)=>{
                console.log(2, this.fetchedData)
               this.productCost = this.fetchedData[0]?.Product_Cost__c ?? 0; 
               //this.alertPriceUpdate(); 
            })
        }else if(this.accountId != ''){
            allPriceBooks({priceBookIds: this.accountpricebooks, productId:this.productId})
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
                                List_Margin__c: x.List_Margin__c,
                                Hold_Margin__c: x.Hold_Margin__c,
                                Floor_Margin__c: x.Floor_Margin__c,
                                List_Margin_Calculated__c: x.List_Margin_Calculated__c,
                                Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                                Product2Id: x.Product2Id,
                                goodPrice: x.Floor_Price__c <= x.UnitPrice? true:false,
                                readOnly: true,
                                sub: x.Sub_Cat__c,
                                btnText: 'Edit', 
                                btnBrand: 'brand',
                                bookURL: `https://advancedturf.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                                pbeURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${x.Id}/view`
                                //bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                                //pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                            }
                        }); 

                        
                        this.fetchedData = [...dataBack];
                        this.accBased = false; 
                        this.userInform = 'Searching best price for this account'
                    }
                }).then((x)=>{
                    console.log(1, this.fetchedData)
                   this.productCost = this.fetchedData[0]?.Product_Cost__c ?? 0; 
                   //this.alertPriceUpdate(); 
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
                            List_Margin__c: x.List_Margin__c,
                            Hold_Margin__c: x.Hold_Margin__c,
                            Floor_Margin__c: x.Floor_Margin__c,
                            List_Margin_Calculated__c: x.List_Margin_Calculated__c,
                            Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                            readOnly: true,
                            Product2Id: x.Product2Id,
                            sub: x.Sub_Cat__c,
                            goodPrice: x.Floor_Price__c <= x.UnitPrice? true:false, 
                            btnText: 'Edit', 
                            btnBrand: 'brand',
                            bookURL: `https://advancedturf.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            pbeURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${x.Id}/view`
                            //bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                            //pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                        }
                    }); 
                    this.fetchedData = [...dataBack];
                    this.accBased = false; 
                    this.userInform = 'Searching all price books this product'
                }).then((x)=>{
                //console.log(1, this.fetchedData)
                   this.productCost = this.fetchedData[0]?.Product_Cost__c ?? 0; 
                   //this.alertPriceUpdate(); 
                })
        }
        this.foundProducts = true;
        this.showFooter = true; 
        this.hasRendered=true; 
      
        
 
    }

    @api counterProds(){
        getCounterUpdates({})
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
                    List_Margin__c: x.List_Margin__c,
                    Hold_Margin__c: x.Hold_Margin__c,
                    Floor_Margin__c: x.Floor_Margin__c,
                    List_Margin_Calculated__c: x.List_Margin_Calculated__c,
                    Min_Margin__c: x.Min_Margin__c === undefined ? x.Floor_Margin__c : x.Min_Margin__c,
                    readOnly: true,
                    Product2Id: x.Product2Id,
                    goodPrice: x.Floor_Price__c <= x.UnitPrice? true:false, 
                    btnText: 'Edit', 
                    btnBrand: 'brand',
                    bookURL: `https://advancedturf.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                    pbeURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${x.Id}/view`
                    //bookURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Pricebook2/${x.Pricebook2Id}/view`,
                    //pbeURL:  `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/PricebookEntry/${x.Id}/view`
                }
            }); 
            this.fetchedData = [...dataBack]; 
            this.userInform = 'Searching all price books this product'
        }).then((x)=>{
        //console.log(1, this.fetchedData)
           this.productCost = this.fetchedData[0]?.Product_Cost__c ?? 0; 
           //this.alertPriceUpdate(); 
        })

        this.foundProducts = true;
        this.showFooter = true; 
        this.hasRendered=true; 
    }
    fixFloorViolations(){
        let indexArr = [];
        this.fetchedData.forEach((ele, index)=>{
            if(ele.goodPrice===false){
                indexArr.push(index);
            }
        })
        if(indexArr.length>0){
            for(const i of indexArr.values()){
                this.fetchedData[i].UnitPrice = this.fetchedData[i].Floor_Price__c
                this.fetchedData[i].List_Margin__c = this.fetchedData[i].Floor_Margin__c
                this.fetchedData[i].goodPrice = true; 
                this.fetchedData[i].isEdited = true; 
                this.template.querySelector(`[data-price="${this.fetchedData[i].Id}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${this.fetchedData[i].Id}"]`).style.color ="black";
            }
        }
        this.fetchedData = [...this.fetchedData]
        this.badPricing = false; 
        this.changesMade = true; 
    }

        selected;
    selectChange(event){
        let newValue = this.template.querySelector('.slds-select').value;
        if(newValue === 'All'){
            this.fetchedData = [...this.gathered]
        }else{
            let filtered = this.groupedData[newValue]
            this.fetchedData = [...filtered]
        }
    }

    handleEnforce(evt){
        this.enforceFloor = evt.target.checked; 
       
    }

    //checkbox
    handleCheck(evt){
        let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);
        this.fetchedData[index].Hold_Margin__c = evt.target.checked; 
        this.fetchedData[index].isEdited = true;
        this.changesMade = true;
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
                this.changesMade = true; 
                this.fetchedData[index].List_Margin__c = roundNum((((this.fetchedData[index].UnitPrice - this.fetchedData[index].Product_Cost__c)/this.fetchedData[index].UnitPrice)*100),2);
                this.handleWarning(this.fetchedData[index])
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

   handleListMargin(evt){
    window.clearTimeout(this.delay); 
    let index = this.fetchedData.findIndex(x => x.Id === evt.target.name);

    this.fetchedData[index].List_Margin__c = roundNum(evt.detail.value,2)
    this.delay = setTimeout(()=>{
        this.changesMade = true;
        this.fetchedData[index].isEdited = true; 
        this.fetchedData[index].UnitPrice = roundNum(this.fetchedData[index].Product_Cost__c/(1- (this.fetchedData[index].List_Margin__c/100)), 2); 
        this.handleWarning(this.fetchedData[index])
    })
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

   //floor mins
   handleWarning(prod){
    let unitPrice = Number(prod.UnitPrice)
    let index = this.fetchedData.findIndex(x=> x.Id === prod.Id)
    if(prod.Floor_Price__c > unitPrice){
        
        this.fetchedData[index].goodPrice = false;
        this.badPricing = true; 
        this.template.querySelector(`[data-price="${prod.Id}"]`).style.color ="red";
        this.template.querySelector(`[data-margin="${prod.Id}"]`).style.color ="red";
    }else if(!prod.goodPrice && prod.Floor_Price__c <= unitPrice){
        
        this.fetchedData[index].goodPrice = true;
        this.template.querySelector(`[data-price="${prod.Id}"]`).style.color ="black";
        this.template.querySelector(`[data-margin="${prod.Id}"]`).style.color ="black";
        this.badPricing = this.fetchedData.filter(x=>x.goodPrice ===false).length>0? true:false; 
    }

   }
   initPriceCheck(){
  
    this.hasRendered = false; 
    for(let i=0; i<this.fetchedData.length; i++){
        let id = this.fetchedData[i].Id;
        let floor = this.fetchedData[i].Floor_Price__c;
        let unitPrice = this.fetchedData[i].UnitPrice;
        if(floor>unitPrice){
            this.badPricing = true; 
            this.fetchedData[i].goodPrice = false; 
            this.template.querySelector(`[data-price="${id}"]`).style.color ="red";
            this.template.querySelector(`[data-margin="${id}"]`).style.color ="red";
        }
    }
   }
   //need a save
   saveRecords = [];
   product = [];
   save(){
    this.foundProducts = false; 
    this.saveRecords = this.fetchedData.filter(x => x.isEdited === true)
    //this.product = this.fetchedData.filter(x=> x.updateProd2 === true)
    const recordInputs = this.saveRecords.slice().map(draft =>{
        let Id = draft.Id;
        let UnitPrice = draft.UnitPrice;
        let List_Margin__c = draft.List_Margin__c;
        let Hold_Margin__c = draft.Hold_Margin__c;
        const fields = {Id, UnitPrice, List_Margin__c, Hold_Margin__c}

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
        this.changesMade = false; 
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
                if(this.fetchedData[i].canEdit){
                    this.fetchedData[i].readOnly = false; 
                }
            }
            this.editAllBTN = 'Close All';
        }else{
            for(let i = 0; i<this.fetchedData.length; i++){
                this.fetchedData[i].readOnly = true; 
            }
            this.editAllBTN = 'Edit All';
        }

   }

   removeLineItem(evt){
    let index = this.fetchedData.findIndex(x=> x.Id === evt.target.name)
    let Id = this.fetchedData[index].Id
    let cf = confirm('Do you want to remove this entry?')
    if(cf ===true){
        this.fetchedData.splice(index, 1);
        deleteRecord(Id);
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
    }).then(()=>{
        //this.alertPriceUpdate()
    }).catch((error)=>{
        console.error(error)
    })
   }



   //math functions; 
   getAverage(arr, field){
    let numb = arr.reduce((total, next)=> total + next[field],0)/arr.length;
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
   //marginCalc()
   
   
   //NOT USED ANYMORE THIS USED TO ALERT THE MAIN COMPONENT TO UPDATE AVERAGE MARGINS PRICING ETC IF YOU WANT TO USE AGAIN
   //NEED TO ADD onnewaverage={handleAverages} TO c-display-table and move  component back into template
   //update the priceInfo component
   //alertPriceUpdate(){
    //this.averageUnitPrice = roundNum(this.getAverage(this.fetchedData, 'UnitPrice'),2);
    //cost shuold be same across board 
    //price can be anything here using average
    //returnDecimalBoolean true/false do you want full number or dec.  
    //this.averageMarginUp = roundNum(this.getAverage(this.fetchedData, 'List_Margin__c'),2)
    
    //const averages = new CustomEvent('newaverage',{
        //detail:{
            //unitprice: this.averageUnitPrice,
           // margins: this.averageMarginUp
       // }
   //})

    //this.dispatchEvent(averages);
    //return refreshApex(this.fetchedData)
   //}

}