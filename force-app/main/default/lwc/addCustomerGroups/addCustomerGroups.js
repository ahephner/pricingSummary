import { api, track, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import createSharePrice from '@salesforce/apex/omsOppUpdatePricing.createSharePriceBook';
import getAllSharedBooks from '@salesforce/apex/omsOppUpdatePricing.getAllSharedBooks';
import getCustomers from '@salesforce/apex/lwcHelper.accountLookUp';
import LightningConfirm from 'lightning/confirm';
import LightningAlert from 'lightning/alert';
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
export default class AddCustomerGroups extends LightningModal {
    @api content
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown noOffSet'
    searchLabel = 'Search Shared Price Books';
    btnText = 'Add Customers'; 
    showPriceBooks = true; 
    newPriceBook = false; 
    addAccounts = false; 
    loaded = true; 
    showResult = false;
    queryTerm; 
    custId; 
    buyerCust = [];
    @track needBuyerEnabled = [];
    selectedPriceBookId = [];
    @track displayText = []; 
    custFound = [];
    connectedCallback() {
        this.getSharedPriceBooks(); 
        this.loaded = true; 
    }

    async getSharedPriceBooks(){
            let getBooks = await getAllSharedBooks(); 
            this.data =  getBooks.map((item)=>{
                //css class
                let checked = false;
                //for search
                let searchName = item.Pricebook2.Name.toLowerCase(); 
                return {...item, checked, searchName}
            })

            this.displayText = [...this.data]
    }
    handleSearch(event){
        
        const searchKey = event.target.value.toLowerCase();
        window.clearTimeout(this.delayTimeout);   
            this.delayTimeout = setTimeout(() =>{
                let base =  JSON.parse(JSON.stringify(this.data))
                
                let narrowed = base.filter(item => { 
                   return item.searchName.toLowerCase().includes(searchKey); 
                });
                
            this.displayText = [...narrowed]
                
            }, 300);
    }

    //CREATE NEW PRICE BOOK AND GROUP HERE!!
    createNewPriceBook(){
        this.showPriceBooks = false;
        this.newPriceBook = true; 
    }
    async createPriceBook(){
            this.loaded = false; 
            let x = this.refs.pbName.value;
            let create = await createSharePrice({name:x}) 
            if(create.includes('success')){
                let mess = create.replace('success ', '')
                //toast does not work in modal
            }else{
                //toast does not work 
                console.error('on create => ', create)
                  
            }
            this.loaded = true; 
            this.showPriceBooks = false;
            this.newPriceBook = false; 
            this.addAccounts = true;
        }

        //control moving the screen along
    moveScreen(){
        switch(this.btnText){
            case 'Add Customers':
                let check = this.selectedPriceBookId.length>0 ? true: false;
                if(check){
                    this.btnText = 'Save and Close';
                    //this.selectedPriceBookId = this.selectedRows.map(x=>x.Id)
                    this.showPriceBooks = false; 
                    this.addAccounts = true; 
                    
                }else{
                    this.handleAlertNoPriceBook(); 
                }
 
                break;
            case 'Save and Close':
               
                this.handleClose()
                break;
            default:
                console.error('switch statement broke')
        }
    }

    handleSelectBook(event){
        event.preventDefault();
        let index = this.displayText.findIndex(item => item.Id === event.target.name)
        let ogIndex = this.data.findIndex(item => item.Id === event.target.name)
        let check = !this.displayText[index].checked
        if(this.selectedPriceBookId.length>0 && check===true){
           alert('Can only select one Price book');
            return; 
        }
        if(index != -1){
            
            this.displayText[index].checked = check; 
            this.data[ogIndex].checked = check; 
            this.displayText = [...this.displayText]; 
            this.data = [...this.data];
            !check ? this.removeId(this.displayText[index].Id) : this.selectedPriceBookId.push(this.displayText[index].Id)
        }

    }

    removeId(id){
        let x = this.selectedPriceBookId.indexOf(id);
        this.selectedPriceBookId.splice(x, 1); 
    }

    @wire(getCustomers,{searchTerm:'$queryTerm'})
    wiredList(result){
        if(result.data){
            let data = result.data.map(item=>({
                ...item,
                nameCode: item.Name,
                checked: false
            }))

            this.custFound = [...data]
            //this.prodsFound; 
            
            this.showCustResult = true;
           // console.log(this.results);  
        }else if(result.error){
            console.log(result.error); 
        }
    }
    showCustResults;
    searchTimeOut;
    minSearch = 3;
    showCustResult = true; 
    handleCustSearch(keyWord){
        if(keyWord.target.value.length === 0){
            this.custFound = [];
            return
        }
        if(this.minSearch > keyWord.target.value.length){
            this.showCustResults = 'false'; 
            return; 
        }
        if(this.searchTimeOut){
            clearTimeout(this.searchTimeOut);
        }
        this.showCustResult = false;
        const key = keyWord.target.value.trim().replace(REGEX_SOSL_RESERVED, '?').toLowerCase();
         this.searchTimeOut = setTimeout(()=>{
             this.queryTerm = key; 
             this.searchTimeOut = null; 

             
         }, SEARCH_DELAY);
        
    }
    handleCustomer(mess){
        this.custId = mess.target.name;
        let index = this.custFound.findIndex(item=> item.Id === this.custId);
        let check = !this.custFound[index].checked
        this.custFound[index].checked = check;
        this.custFound = [...this.custFound]
        if(!this.custFound[index].IsBuyer){
            //const {Id, Name} = this.custFound[index];
            let newBuyer = {
                sObjectType: 'BuyerAccount',
                BuyerId: this.custFound[index].Id,
                BuyerStatus: 'Active',
                IsActive: true,
                Name: this.custFound[index].Name
            }
            this.needBuyerEnabled = [...this.needBuyerEnabled,newBuyer]
        
        }else{
            this.buyerCust.push(this.custId);
        }
    }
    checkClose(){
        if(this.selectedPriceBookId.length>0){
            this.handleConfirmClick()
        }else{
            this.handleClose();
        }
    }

    async handleAlertNoPriceBook() {
        await LightningAlert.open({
            message: 'Please select at least one pricebook',
            theme: 'error', // a red theme intended for error states
            label: 'No Pricebook Selected', // this is the header text
        });
        //Alert has been closed
    }

    async handleConfirmClick() {
        const result = await LightningConfirm.open({
            message: 'Do you wish to cancel?',
            variant: 'header',
            label: 'Unsaved line items',
            // setting theme would have no effect
        });
        if(result){
            this.noSaveClose(); 
        }
    }
    //for closing if user wants to abort
    noSaveClose(){
        this.close('aborted')
    }
    handleClose(){
       let back = {bookId: this.selectedPriceBookId,
                   customers: this.buyerCust,
                   needBuyer: this.needBuyerEnabled
                }
        this.close(back);
    }
    cancelPriceBook(){
        this.newPriceBook = false; 
        this.showPriceBooks = true;
    }
}