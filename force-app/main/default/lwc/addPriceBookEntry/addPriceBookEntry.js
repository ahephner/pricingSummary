import { api, track, wire } from "lwc";
import LightningModal from 'lightning/modal';
import LightningConfirm from 'lightning/confirm';
import LightningAlert from 'lightning/alert';
import checkPriceBooks from '@salesforce/apex/getPriceBooks.addToPriceBook';
import apexPriorityPricing from '@salesforce/apex/getPriceBooks.priorityBestPrice'
import getAccountId from '@salesforce/apex/getPriceBooks.getAccId';
import getPriorityPriceBooks from '@salesforce/apex/omsCPQAPEX.getPriorityPriceBooks';
import getPriceBooks from '@salesforce/apex/lwcHelper.getAllBuyerBooks';
import getProducts from '@salesforce/apex/lwcHelper.product2LookUp';
import {roundNum} from 'c/programBuilderHelper';
import {priorityPricing} from 'c/helperOMS'
const SEARCH_DELAY = 500;
const REGEX_SOSL_RESERVED = /(\?|&|\||!|\{|\}|\[|\]|\(|\)|\^|~|\*|:|"|\+|\\)/g;
//STANDARD_PRICEBOOK = '01s410000077vSKAAY'; 
const columns = [{ label: 'Name', fieldName: 'Name' }]
export default class AddPriceBookEntry extends LightningModal {
    product2Id;
    queryTerm;
    @api priceBookId 
    @track newProds = []
    foundProducts = true; 
    apexOrderBy=''
    pricebookFound = true; 
    addProducts = false;
    haveBookProduct = false;
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown noOffSet'
    loaded = false; 
    colList = columns; 
    data = [];
    selectedRows = [];
    selectedPriceBookId = [];
    prodsFound = [];
    //The next 2 vars are used for adding priority pricing
    //single price book when updating priority pricing; 
    accountPriceBook; 
    //used for adding entries in priority entry
    priorityPricebooksId = []; 
    searchLabel = 'Search Price Books' 
    btnText = 'Add Products'; 
    showResult = false;
    singlePriceBook; 
    @track displayText = []; 
    connectedCallback() {
        this.handleAllPriceBooks();
        this.loaded = true; 
    }
    //productSearching
    @wire(getProducts,{searchTerm:'$queryTerm'})
        wiredList(result){
            if(result.data){
                let data = result.data;
                let unsorted = data.map(item=>({
                    ...item,
                    nameCode: `${item.Name} - ${item.ProductCode}`,
                    checked: false
                }))
                let noStatus = unsorted.filter((x)=>x.Product_Status__c === undefined);
                let sorted = unsorted.filter((x)=>x.Product_Status__c != undefined).sort((a,b)=>b.Product_Status__c.localeCompare(a.Product_Status__c))
                this.prodsFound = [...sorted,...noStatus]
                //this.prodsFound; 
                this.loadingProducts = false;
                this.showResult = true;
               // console.log(this.results);  
            }else if(result.error){
                console.log(result.error); 
            }
        }
        
    handleClear(mess){
        let clearWhat = mess.detail; 
        switch(clearWhat){
            case 'product':
                this.product2Id = '';
                
                break;
            case 'pricebook':
                this.priceBookId = '';
                this.pricebookFound = ''; 
                this.pricebookFound = false;
                break;
            default:
                console.log('not found')
        }
    }


    handlePriceBook(mess){
        this.priceBookId = mess.detail.id;
        this.priceBookName = mess.detail.name; 
        this.pricebookFound = true; 
    }
     
    //this function is called below and is used to get price book specifics to the account that is selected. 
    async accountPriceInfo(m){
        this.showResult = false; 
        this.loaded = false;
        try {
            let buyerId = m[0].BuyerGroupId;
            this.accountPriceBook = m[0].Pricebook2Id
            //get account
            let accountId = await getAccountId({buyer: buyerId})
            //get priority price books assocaited with this account
            let priceData = await getPriorityPriceBooks({accountId: accountId})
            //helper function to organize the price books 
            let pricingInfo = await priorityPricing(priceData);
            this.priorityPricebooksId = [...pricingInfo.priceBookIdArray]; 
             
        } catch (error) {
            console.log('processing price book err=> ',error);
        }

        this.showResult = true
        this.loaded = true; 
    }
    //control moving the screen along
    moveScreen(){
        switch(this.btnText){
            case 'Add Products':
                let check = this.selectedPriceBookId.length>0 ? true: false;
                if(check){
                    this.showResult = false; 
                    this.btnText = 'Edit Price';
                    this.searchLabel = 'Search Products'
                    //this.triggers if one price book use the dynamic pricing otherwise search standard pricebook
                    this.singlePriceBook = this.selectedPriceBookId.length === 1 && this.selectedPriceBookId[0].Priority ===2 ? this.accountPriceInfo(this.selectedPriceBookId) : false; 
                    this.pricebookFound = false; 
                    this.addProducts = true; 
                    this.showResult = true;
                }else{
                    this.handleAlertNoPriceBook(); 
                }
 
                break;
            case 'Edit Price':
                let checkPod = this.newProds.length > 0? true : false;
                if(checkPod){
                    this.btnText = 'Save and Close';
                    //this.selectedPriceBookId = this.selectedRows.map(x=>x.Id)
                    this.addProducts = false; 
                    this.haveBookProduct = true;
                }else{
                    this.handleAlertClick(); 
                }
 
                break;
            case 'Save and Close':
                let products = this.createAllEntries();
                this.close(products)
                break;
            default:
                console.error('switch statement broke')
        }
    }
    //load all pricebooks
    async handleAllPriceBooks(){
        let getBooks = await getPriceBooks(); 
        this.data =  getBooks.map((item)=>{
            //css class
            let checked = false;
            //for search
            let searchName = item.Pricebook2.Name.toLowerCase(); 
            let iconName = item.Priority === 2 ? 'Account Based': item.Priority === 3 ? 'Group' : item.Priority === 1 ? 'National':item.Priority === 4 ? 'Corp.': ''

            return {...item, checked, searchName, iconName}
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

    //This is the prodcut search function. It is effected by the first case statement in the move screen. That function checks the length of the pricebooks selected
    //If there are multiple price books selected it will only search here using the first singlePriceBook. IT gets all product ids at that point from standard price book. 
    //Otherwise it will use the price book id's from the set in the case function
    showProdResults
    searchTimeOut;
    minSearch = 3;
    handleProdSearch(keyWord){
        if(keyWord.target.value.length === 0){
            this.prodsFound = [];
            return
        }
        if(this.minSearch > keyWord.target.value.length){
            this.showProdResults = 'false'; 
            return; 
        }

        if(this.searchTimeOut){
            clearTimeout(this.searchTimeOut);
        }
        this.showResult = false; 
        const key = keyWord.target.value.trim().replace(REGEX_SOSL_RESERVED, '?').toLowerCase();
         this.searchTimeOut = setTimeout(()=>{
             this.queryTerm = key; 
             this.searchTimeOut = null; 

             
         }, SEARCH_DELAY);
    }
    handleSelectBook(event){
        event.preventDefault();
        let index = this.displayText.findIndex(item => item.Id === event.target.name)
        let ogIndex = this.data.findIndex(item => item.Id === event.target.name)
        if(index != -1){
            let check = !this.displayText[index].checked
            
            this.displayText[index].checked = check; 
            this.data[ogIndex].checked = check; 
            this.displayText = [...this.displayText]; 
            this.data = [...this.data];
            !check ? this.removeId(this.displayText[index].Id) : this.selectedPriceBookId.push(this.displayText[index])
        }

    }
    removeId(id){
        let x = this.selectedPriceBookId.map(e=>e.Id).indexOf(id);
        this.selectedPriceBookId.splice(x, 1); 
    }

    handleProduct(mess){
        this.product2Id = mess.target.name; 
        let index = this.prodsFound.findIndex(item => item.Id === this.product2Id)
        let check = !this.prodsFound[index].checked
        this.prodsFound[index].checked = check;
        this.prodsFound = [...this.prodsFound]; 
        this.addProduct(); 
    }
    async addProduct(){
        let mess = {detail: 'product'}
        let back
        if(this.singlePriceBook === false){
            back = await checkPriceBooks({pricebook: '01s410000077vSKAAY' , productId: this.product2Id, orderBy:this.apexOrderBy })
        }else{
            back = await apexPriorityPricing({priceBookIds: this.priorityPricebooksId, productId:this.product2Id})
        }
        let add = await this.addList(back);
        this.handleClear(mess)
    }

    addList(x){
        if(x){            
            this.newProds = [
                ...this.newProds,{
                    sObjectType: 'PricebookEntry',
                    Id: '',
                    Pricebook2Id: '',
                    Product2Id: this.product2Id,
                    UnitPrice: x[0].UnitPrice,
                    List_Margin__c: this.checkMarg(x[0]),
                    name: x[0].Product2.ERP_Name__c,
                    flrPrice: x[0].Floor_Price__c,
                    PriceBookName: x[0].Pricebook2.Name,
                    Product_Cost__c: x[0].Product_Cost__c,
                    UseStandardPrice: false,
                    Hold_Margin__c: true,
                    Hold_Rounded_Margin__c: false,
                    IsActive: true,
                    isChanged__c: false,
                    readOnly: x[0].Agency_Product__c ? true : false
                }
            ]
    }
        
    }
//will check if product is agency or list margin is set
    checkMarg(item){
        let value = '';
        if(item.Agency_Product__c){
            return value; 
        }else if(item.List_Margin_Calculated__c === undefined){
            return value = roundNum((((item.UnitPrice - item.Product_Cost__c)/item.UnitPrice)*100),2)
        }else{
            return value = item.List_Margin_Calculated__c; 
        }
    }
    handleListMargin(evt){
        window.clearTimeout(this.delay); 
        let index = this.newProds.findIndex(x => x.Product2Id === evt.target.name);
    
        this.newProds[index].List_Margin__c = roundNum(evt.detail.value,2)
        this.delay = setTimeout(()=>{
            this.changesMade = true;
            this.newProds[index].isEdited = true; 
            this.newProds[index].UnitPrice = roundNum(this.newProds[index].Product_Cost__c/(1- (this.newProds[index].List_Margin__c/100)), 2); 
        })
       }
   
       handleUnitPrice(evt){
        window.clearTimeout(this.delay);
        let index = this.newProds.findIndex(x => x.Product2Id === evt.target.name);
            this.delay = setTimeout(()=>{
                this.newProds[index].UnitPrice = Number(evt.detail.value);
                this.newProds[index].isEdited = true;
                if(this.newProds[index].UnitPrice > 0){
                    this.changesMade = true; 
                    this.newProds[index].List_Margin__c = roundNum((((this.newProds[index].UnitPrice - this.newProds[index].Product_Cost__c)/this.newProds[index].UnitPrice)*100),2);
                         
                    }
            },800)
        }   

 //checkbox
    handleCheck(evt){
        let index = this.newProds.findIndex(x => x.Product2Id === evt.target.name);
        this.newProds[index].Hold_Margin__c = evt.target.checked; 
        this.newProds[index].isEdited = true;
    }
    //this will create all price book entries from the price books selected
    createAllEntries(){
        let updated = []
        for(let i = 0; i< this.newProds.length; i++){
            let add = this.selectedPriceBookId.map((pricebookId)=>{
                let newObj = {...this.newProds[i]}
                newObj.Pricebook2Id = pricebookId.Pricebook2Id;
                return newObj
            })
            updated = [...updated, ...add]
        }
        return updated; 
    }
    handleSave(){    
        if(this.newProds.length>0){
            this.close(this.newProds)
        }else{
            this.handleAlertClick(); 
        }
    }

    checkClose(){
        if(this.newProds.length>0){
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
    async handleAlertClick() {
        await LightningAlert.open({
            message: 'Please select at least one product',
            theme: 'error', // a red theme intended for error states
            label: 'No Products Selected', // this is the header text
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
            this.handleClose(); 
        }
    }

    instructions = 'To use priority pricing select one account based price book. The initial editable price will be based on account priority. Meaning it will check if the product is in National, Account, Group etc until it finds the product and list price. This price is editable. To mass add products to price books. Select all of the price books you want to update. Then selected product initial price is based on the standard price book list price.'
    async showInstructions(){
        const result = await LightningConfirm.open({
            message: this.instructions,
            variant: 'headerless',
            label: 'this is the aria-label value',
            // setting theme would have no effect
        });
        //result is true if OK was clicked
        //and false if cancel was clicked
        console.log('Result: '+ result);
        //Confirm has been closed
        
    
    }

    selectAllLabel = 'Select All'; 
    selectAllVar = 'success'; 
    massEdit(){
         if(this.selectAllLabel === 'Select All'){

            for(let i= 0; i<this.displayText.length;i++){
                this.displayText[i].checked = true;
                this.selectedPriceBookId.push(this.displayText[i].Id)
            }
            this.displayText = [...this.displayText];
            this.data = [...this.displayText]
            this.selectAllLabel = 'Unselect All';
            this.selectAllVar = 'destructive';
         }else{
            for(let i= 0; i<this.displayText.length;i++){
                this.displayText[i].checked = false;
            }
            this.displayText = [...this.displayText];
            this.data = [...this.displayText]
            this.selectedPriceBookId =[]
            this.selectAllLabel = 'Select All';
            this.selectAllVar = 'success'; 
         } 
    }

    handleClose(){
        this.selectedPriceBookId = [];
        this.close('close');
    }
}