import { LightningElement, track } from 'lwc';
import getPriceBooks from '@salesforce/apex/omsCPQAPEX.getPriorityPriceBooks';

export default class PriceSummaryHolder extends LightningElement {
    acctPriceBooks = [];
    priceBookName;
    listPrice; 
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
        //no double values and assign the standard price book up front; 
        let list = new Set()
        //let list = new Set(); 
        let data = await getPriceBooks({accountId: event.detail}); 
        if(data){
            let standardPricebook = {Pricebook2Id: '01s410000077vSKAAY',Priority:6, PriceBook2:{Name:'Standard'} }
            let order = [...data, standardPricebook].filter((x)=>x.Priority!=undefined).sort((a,b)=>{
                return a.Priority - b.Priority; 
            })

            if(order.length>=1 && data != undefined){
                for(let i = 0; i<order.length;i++){
                    list.add(order[i].Pricebook2Id);
                }
                console.log('updated pricebook ids ' , order)
            }
        }

        this.acctPriceBooks = [...list];
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
    showInfo = false; 
    async handleAverages(evt){
        let wait = await this.letSpreadBreath(400)
        this.showInfo = true; 
        this.avgProps = {
            unitPrice: evt.detail?.unitprice ?? 'not found',
            margin: evt.detail?.margins ?? 'not found',
            productId: this.productId
        }
    }

    counterInfo(){
        this.template.querySelector("c-display-table").counterProds();
    }
}