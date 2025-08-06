import { LightningElement, wire, track, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getBooks from '@salesforce/apex/lwcHelper.pricebookLookUp';
import ProfileName from '@salesforce/schema/User.Profile.Name'
import Id from '@salesforce/user/Id';
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
export default class PriceBookLookUp extends LightningElement {
    //get current user roll
    profileName; 
    queryTerm;
    //MAKE THIS 5 BEFORE SENDING TO PROD
    minSearch = 3;
    searchTimeOut;
    @track results;
    @track selectedPB = [];
    loading = true; 
    showResult = false; 
    @api styletype; 
    @wire(getRecord, { recordId: Id, fields: [ProfileName] })
    userDetails({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            this.profileName = data.fields.Profile.value.fields.Name.value;
        }
    }
    @wire(getBooks,{searchTerm:'$queryTerm', profileName: '$profileName'})
        wiredList(result){
            if(result.data){
                this.results = result.data;
                this.loading = false;
                this.showResult = true;
               //console.log(this.results);  
            }else if(result.error){
                console.log(result.error); 
            }
        }
    handleClear(){
        this.showResult = false;
        this.pbName = '';
        const clearPriceBook = new CustomEvent('clearbookid', {detail: 'pricebook'});
        this.dispatchEvent(clearPriceBook)
    }
    handleKeyUp(keyWord){
        //console.log(this.profileName)
        if(keyWord.target.value.length ===0){
            this.handleClear(); 
        }
        if(this.minSearch > keyWord.target.value.length){
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
pbName; 
    itemSelect(x){
        const pbId = x.currentTarget.dataset.recordid; 
        this.pbName = x.currentTarget.dataset.name;
        const info = {id: pbId,
                     name: this.pbName}
        const newPB = new CustomEvent('newpricebook', {detail: info});
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