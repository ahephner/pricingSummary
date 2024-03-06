import { LightningElement } from 'lwc';
import singlePicklist from '@salesforce/apex/lwcHelper.getPickListValues'; 
import LightningAlert from 'lightning/alert';
export default class PriceSummary extends LightningElement {
    hideFilter = true;
    limitValue = 'no';
    orderByValue = 'none';
    product2Id;
    accountId;
    primaryCategory;   
    primCat = 'All';
    priceBookId; 
    
    field = 'UnitPrice'; 
    connectedCallback(){
        singlePicklist({objName:'Product2', fieldAPI:'Primary_Category__c'})
            .then((x)=>{
                this.primaryCategory = x; 
            })
    }
    async handleSearch(){
        let pass = this.valid()
         
        if(pass){
            const info =  new CustomEvent('searchvars',{
                detail:{
                    product2:this.product2Id,
                    accId: this.accountId,
                    priceField: this.field, 
                    limitAmount: this.limitValue === 'no'? 0 : Number(this.limitValue),
                    orderBy: this.orderByValue,
                    primCat: this.primCat
                }
            })
            
            this.dispatchEvent(info);
        }else{
            await LightningAlert.open({
                message: 'Please select account or product!',
                theme: 'error', // a red theme intended for error states
                label: 'Error!', // this is the header text
            });
        }
    }

    // handleSearch(){
    //     console.log(`product2 ${this.product2Id}  accId: ${this.accountId} priceField: ${this.field}`)
    //     console.log(`limitAmount: ${this.limitValue} orderBy: ${this.orderByValue} primCat: ${this.primCat}`)
    // }
    showFilter(){
       this.hideFilter = !this.hideFilter ? true : false; 
    }
    //pricefields
    get priceFields(){
        return[
            {label:'List Price', value:'UnitPrice'},
            {label:'Cost', value:'Product_Cost__c'},
            {label:'Floor', value:'Floor_Price__c'},
            {label:'Floor Margin', value:'Floor_Margin__c'},
            {label:'Level 1', value:'Level_1_UserView__c'},
            {label: 'Level 1 Margin', value: 'Level_One_Margin__c'}, 
            {label:'Level 2', value:'Level_2_UserView__c'},
        ]
    }

    handlePriceField(evt){
        this.field = evt.detail.value; 
    }
    //order by
    get orderByOptions(){
        return[
            {label:'None', value:'none'},
            {label:'Highest Price', value:'DESC'},
            {label:'Lowest Price', value:'ASC'}
        ]
    }

    handleOrderBy(evt){
        this.orderByValue = evt.detail.value
    }
    
    //limit results
    get limitOptions() {
        let options = [];
        for(let i = 0; i<11; i++){
            let option = {label: i, value:`'${i}'`}
            options.push(option);
        }
        let noChoice = {label:'No', value:'no'}
        options.unshift(noChoice)
        return options; 
    }

    handleLimits(event){
        this.limitValue = event.detail.value; 
    }

    handleProduct(mess){
        this.product2Id = mess.detail; 

        // if(hideFilter){
        //     this.handleSearch()
        // }
    }
    handleAccount(mess){
        this.accountId = mess.detail; 
        //need to get avaliable price books now for the account in the priceSummaryHolder
        const newAccount = new CustomEvent('newcust', {detail: this.accountId});
        this.dispatchEvent(newAccount);
    }
    handlePriceBook(mess){
        this.priceBookId = mess.detail; 
        console.log(1, this.priceBookId)
    }
    handlePrimCat(x){
        this.primCat = x.detail.value; 
    }
    valid(){
        let good = true; 
        if(this.accountId === undefined && 
           this.product2Id === undefined){
            good = false; 
           }
           return good; 
    }

}