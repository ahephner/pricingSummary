import { LightningElement } from 'lwc';

export default class PriceSummary extends LightningElement {
    hideFilter = true;
    limitValue = 'no';
    orderByValue = 'none';
    product2Id;
    accountId;  
    handleSearch(){
        let pass = this.valid()
        if(pass){
            const info =  new CustomEvent('searchvars',{
                detail:{
                    product2:this.product2Id,
                    accId: this.accountId,
                    limitAmount: this.limitValue,
                    orderBy: this.orderByValue
                }
            })
            console.log(info.detail.product2)
            this.dispatchEvent(info);
        }
    }

    showFilter(){
       this.hideFilter = !this.hideFilter ? true : false; 
    }
    //order by
    get orderByOptions(){
        return[
            {label:'None', value:'none'},
            {label:'Highest Price', value:'high'},
            {label:'Lowest Price', value:'low'}
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
    }
    handleAccount(mess){
        this.accountId = mess.detail; 
        //need to get avaliable price books now for the account in the priceSummaryHolder
        const newAccount = new CustomEvent('newcust', {detail: this.accountId});
        this.dispatchEvent(newAccount);
    }

    valid(){
        let good = true; 
        if(this.accountId === undefined || 
           this.product2Id === undefined){
            good = false; 
           }
           return good; 
    }
}