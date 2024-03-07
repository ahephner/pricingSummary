import { LightningElement, api, wire, track } from 'lwc';
import getDocs from '@salesforce/apex/lwcHelper.accountLookUp';
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
export default class AccountLookUp extends LightningElement {
    queryTerm;
    //MAKE THIS 5 BEFORE SENDING TO PROD!
    minSearch = 3;
    searchTimeOut;
    @track results;
    @track selectedSO = [];
    loading = true;
    showResult = false;  
    
    @wire(getDocs,{searchTerm:'$queryTerm'})
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
        
        if(keyWord.target.value.length ===0){

            this.showResult = false;
            this.accId = '';
            const newAcc = new CustomEvent('newaccount', {detail: this.accId});
            this.dispatchEvent(newAcc);
            return;   
        }else if(this.minSearch > keyWord.target.value.length){

            this.showResult = false; 
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
accId;  
    itemSelect(x){
        this.accId = x.currentTarget.dataset.recordid; 
        this.accName = x.currentTarget.dataset.name;
         
        const newAcc = new CustomEvent('newaccount', {detail: this.accId});
        this.dispatchEvent(newAcc); 
         
//!when the input wont clear we could try grabbing the input and setting it to '' 
  
        //this.queryTerm = '';
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
        return 'slds-listbox slds-listbox_vertical slds-dropdown drop';
    }
}
