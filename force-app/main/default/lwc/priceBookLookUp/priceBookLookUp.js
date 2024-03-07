import { LightningElement, wire, track } from 'lwc';
import getBooks from '@salesforce/apex/lwcHelper.pricebookLookUp';
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
export default class PriceBookLookUp extends LightningElement {
    queryTerm;
    //MAKE THIS 5 BEFORE SENDING TO PROD
    minSearch = 3;
    searchTimeOut;
    @track results;
    @track selectedPB = [];
    loading = true; 
    showResult = false; 

    @wire(getBooks,{searchTerm:'$queryTerm'})
        wiredList(result){
            if(result.data){
                this.results = result.data;
                this.loading = false;
                this.showResult = true;
               // console.log(this.results);  
            }else if(result.error){
                console.log(result.error); 
            }
        }
    handleKeyUp(keyWord){
        
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
pbName; 
    itemSelect(x){
        const pbId = x.currentTarget.dataset.recordid; 
        this.pbName = x.currentTarget.dataset.name;
         
        const newPB = new CustomEvent('newpricebook', {detail: pbId});
        this.dispatchEvent(newPB); 
         
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
        //slds-dropdown_fluid
        return 'slds-listbox slds-listbox_vertical slds-dropdown drop';
    }
}