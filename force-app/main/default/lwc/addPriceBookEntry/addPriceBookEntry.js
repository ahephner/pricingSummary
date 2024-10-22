import { api, track, wire } from "lwc";
import LightningModal from 'lightning/modal';
import LightningConfirm from 'lightning/confirm';
import LightningAlert from 'lightning/alert';
import checkPriceBooks from '@salesforce/apex/getPriceBooks.addToPriceBook';
import getPriceBooks from '@salesforce/apex/lwcHelper.getAllBooks';
import getProducts from '@salesforce/apex/lwcHelper.product2LookUp';
import {roundNum} from 'c/programBuilderHelper';
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
    btnText = 'Add Products'; 
    showResult = false; 
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

    //control moving the screen along
    moveScreen(){
        switch(this.btnText){
            case 'Add Products':
                let check = this.selectedPriceBookId.length>0 ? true: false;
                if(check){
                    this.btnText = 'Edit Price';
                    //this.selectedPriceBookId = this.selectedRows.map(x=>x.Id)
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
            let searchName = item.Name.toLowerCase(); 
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
                   return item.Name.toLowerCase().includes(searchKey); 
                });
                
            this.displayText = [...narrowed]
                
            }, 300);
    }
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
            !check ? this.removeId(this.displayText[index].Id) : this.selectedPriceBookId.push(this.displayText[index].Id)
        }

    }
    removeId(id){
        let x = this.selectedPriceBookId.indexOf(id);
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
        let back = await checkPriceBooks({pricebook: '01s410000077vSKAAY' , productId: this.product2Id, orderBy:this.apexOrderBy })
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
                    name: x[0].Name,
                    flrPrice: x[0].Floor_Price__c,
                    Product_Cost__c: x[0].Product_Cost__c,
                    UseStandardPrice: false,
                    Hold_Margin__c: false,
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
                newObj.Pricebook2Id = pricebookId;
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

        this.close('cancel');
    }
}