import { LightningElement } from 'lwc';
import singlePicklist from '@salesforce/apex/lwcHelper.getPickListValues'; 
import LightningAlert from 'lightning/alert';
import AddPriceBoookEntry from 'c/addPriceBookEntry'; 
import savePBE from '@salesforce/apex/getPriceBooks.savePBE';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class PriceSummary extends LightningElement {
    hideFilter = true;
    limitValue = 'no';
    orderByValue = 'none';
    product2Id;
    accountId;
    primaryCategory;   
    primCat = 'All';
    priceBookId; 
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown drop'

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
                    primCat: this.primCat,
                    pbId: this.priceBookId
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
    async addProduct(){
        const result = await AddPriceBoookEntry.open({
            size: 'medium',
            description: 'Accessible description of modal\'s purpose',
            content: 'Passed into content api',
        }).then((res)=>{
            const recordInputs = res.slice().map(draft =>{

                let Pricebook2Id = draft.Pricebook2Id;
                let Product2Id = draft.Product2Id; 
                let UseStandardPrice = false; 
                let IsActive = draft.IsActive;
                let UnitPrice = draft.UnitPrice;
                let List_Margin__c = draft.List_Margin__c;
                let Hold_Margin__c = draft.Hold_Margin__c;
                const fields = {Pricebook2Id, Product2Id, UseStandardPrice, IsActive, UnitPrice, List_Margin__c, Hold_Margin__c}
        
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
                    })
        }).catch((error)=>{
            console.error(error)
        })
       }

    handleClear(mess){
        let clearWhat = mess.detail; 
        switch(clearWhat){
            case 'product':
                this.product2Id = '';
                break;
            case 'account':
                this.accountId = '';
                break;
            case 'pricebook':
                this.priceBookId = '';
                break;
            default:
                console.log('not found')
        }
    }
    handleAccount(mess){
        this.accountId = mess.detail; 
        //need to get avaliable price books now for the account in the priceSummaryHolder
        if(this.accountId.length>1){
            const newAccount = new CustomEvent('newcust', {detail: this.accountId});
            this.dispatchEvent(newAccount);
        }
    }
    handlePriceBook(mess){
        //mess.id = id mess.name = pricebook name
        this.priceBookId = mess.detail.id; 
        
    }
    handlePrimCat(x){
        this.primCat = x.detail.value; 
    }
    valid(){
        let good = true; 
        if(this.accountId === undefined && 
           this.product2Id === undefined && 
           this.priceBookId === undefined){
            good = false; 
           }
           return good; 
    }

    getCounterUpdates(){
        const info =  new CustomEvent('counterinfo');
        this.dispatchEvent(info);
    }

}