import { LightningElement, api, wire, track } from 'lwc';
import getProducts from '@salesforce/apex/lwcHelper.product2LookUp';
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
export default class Product2LookUp extends LightningElement {
    queryTerm;
    //MAKE THIS 5 BEFORE SENDING TO PROD!
    minSearch = 3;
    searchTimeOut;
    @track results;
    @track selectedSO = [];
    loading = true;
    showResult = false;  
    
    @wire(getProducts,{searchTerm:'$queryTerm'})
        wiredList(result){
            if(result.data){
                let data = result.data;
                this.results = data.map(item=>({
                    ...item,
                    nameCode: `${item.Name} - ${item.ProductCode}`
                }))
                this.loading = false;
                this.showResult = true;
               // console.log(this.results);  
            }else if(result.error){
                console.log(result.error); 
            }
        }
    handleClear(){
        this.showResult = false; 
        this.accName = ''
        const clearProd = new CustomEvent('clearprod', {detail: 'product'});
        this.dispatchEvent(clearProd); 
    }
    //this is cleared from addPricebookEntry in pricing summary
    @api
    handleClearPBE(){
        this.showResult = false;
        this.accName = ''; 
    }
    handleKeyUp(keyWord){
        
        if(keyWord.target.value.length === 0){
            this.handleClear();
            return
        }
        if(this.minSearch > keyWord.target.value.length){
            this.showResult = 'false'; 
            return; 
        }

        if(this.searchTimeOut){
            clearTimeout(this.searchTimeOut);
        }
        const key = keyWord.target.value.trim().replace(REGEX_SOSL_RESERVED, '?').toLowerCase();
         this.searchTimeOut = setTimeout(()=>{
             this.loading = true;
             this.queryTerm = key; 
             this.searchTimeOut = null; 

             
         }, SEARCH_DELAY); 
    }
accName; 
    itemSelect(x){
        x.preventDefault();
        const accId = x.currentTarget.dataset.recordid; 
        this.accName = x.currentTarget.dataset.name;
         
        const newProd = new CustomEvent('newproduct', {detail: accId});
        this.dispatchEvent(newProd); 
         
//!when the input wont clear we could try grabbing the input and setting it to '' 
  
        // this.queryTerm = '';
        this.showResult = false; 
        
        
    }
//remove selected SO
    removeSO(x){
        let index = this.selectedSO.findIndex(item => item.name = x.detail)
        console.log('index');
        
        this.selectedSO.splice(index, 1);
        this.selectedSO = [...this.selectedSO]; 
    }

//styling
    get getListBoxClass(){
        return 'slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid';
        //from the counter sale look up mark up
        //span slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta
        //return 'slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid slds-dropdown_length-with-icon-7'
    }
}