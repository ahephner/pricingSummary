import { LightningElement, track } from 'lwc';
import getPriceBooks from '@salesforce/apex/omsCPQAPEX.getPriorityPriceBooks';
import {priorityPricing} from 'c/helperOMS'
export default class PriceSummaryHolder extends LightningElement {
    acctPriceBooks = [];
    priceBookName;
    listPrice; 
    accSearch = false;
    passedaccount;  
    showAll= true; 
    @track childProps = {
        productId: '',
        accountId: '',
        limitedSearchRes: '',
        orderSearchBy: '',
        primaryCat: '',
        priceSearchField: '',
        apexOrderBy: ''
    };
    @track avgProps = {
        unitPrice: '',
        margin: '',
        prodId: ''
    }
    foundProducts = false;
    async newAccountGetPB(event){
        
        let data = await getPriceBooks({accountId: event.detail});
        let pricingInfo = await priorityPricing(data);
        
        this.passedaccount = pricingInfo.priceBooksObjArray.map(item=>{
            console.log(item)
            return{
                Id: item?.Id??'123',
                Name: item.Pricebook2?.Name ?? 'Default', 
                Priority: item.Priority
            }
        }); 
        this.acctPriceBooks = [...pricingInfo.priceBookIdArray];
        this.accSearch = true; 
    }
    //this function recieves and transmits the search prompts here
    //the reason for the timeout is that the lwc:spread function has not native async when built 2/12/24 or at least this dev was unaware. 
    //so we force a quick timeout to allow the prompts to properly pass down the stack. before we do that we call a child function iAmSpinning to start the spinner on the datatable
    //to prevent double clicks. 
    priceField; 
    foundPrice = false; 
    productId; 
    priceBookId; 
    async handleSearch(ext){       
        let orderBy = ext.detail?.orderBy ?? '';
        this.priceField = ext.detail?.priceField ?? 'error';
        this.productId = ext.detail?.product2 ?? '';
        this.priceBookId = ext.detail?.pbId ?? ''; 
        //pass the order by to apex. This tells it to show me best deal or not
        let apexOrderBy = orderBy != 'none'? ' ORDER BY '+this.priceField +' '+orderBy+'' : ' ORDER BY '+ this.priceField +' ASC';
        
        this.childProps = await {...this.childProps, 
                            productId: this.productId,
                            accountId: ext.detail?.accId ?? '',
                            priceBookId: this.priceBookId,
                            limitedSearchRes: ext.detail?.limitAmount ?? '',
                            orderSearchBy: ext.detail?.orderBy ?? '',
                            primaryCat: ext.detail?.primCat ?? '',
                            priceSearchField: ext.detail?.priceField ?? 'error',
                            apexOrderBy: apexOrderBy
                        }
        this.template.querySelector("c-display-table").iAmSpinning();
        let to = await this.letSpreadBreath(350);
                 
        //load products in table
        this.template.querySelector("c-display-table").loadProds();
        
    }
     letSpreadBreath(timeOutTime) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('resolved');
          }, timeOutTime);
        });
      }
    handleOpen(evt){
        let index = evt.target.name; 
        this.fetchedData[index].readOnly = false; 
    }

    //NOT USED ANYMORE USED TO SHOW PRICE BOOK AVERAGES. MORE INFO FOUND IN DISPLAYTABLE JS ON COMMENTED OUT FUNCTION alertPricingUpdate
    // showInfo = false; 
    // async handleAverages(evt){
    //     let wait = await this.letSpreadBreath(400)
    //     this.showInfo = true; 
    //     this.avgProps = {
    //         unitPrice: evt.detail?.unitprice ?? 'not found',
    //         margin: evt.detail?.margins ?? 'not found',
    //         productId: this.productId
    //     }
    // }
    iconName = 'utility:chevronleft'; 
    searchBoxClass = 'slds-col slds-size_1-of-3';
    tableClass='slds-col slds-size_2-of-3';
    handleDisplay(){
        this.showAll = !this.showAll; 
        this.iconName = this.iconName === 'utility:chevronleft' ? 'utility:chevronright':'utility:chevronleft';
        this.tableClass = this.showAll ? 'slds-col slds-size_2-of-3':'slds-col slds-size_1-of-1' 
    }
    counterInfo(){
        this.template.querySelector("c-display-table").counterProds();
    }
}