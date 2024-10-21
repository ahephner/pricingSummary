import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
import LightningConfirm from 'lightning/confirm';
import LightningAlert from 'lightning/alert';
import checkPriceBooks from '@salesforce/apex/getPriceBooks.addToPriceBook';
import getPriceBooks from '@salesforce/apex/lwcHelper.getAllBooks';
import {roundNum} from 'c/programBuilderHelper';
//STANDARD_PRICEBOOK = '01s410000077vSKAAY'; 
const columns = [{ label: 'Name', fieldName: 'Name' }]
export default class AddPriceBookEntry extends LightningModal {
    product2Id;
    @api priceBookId 
    @track newProds = []
    foundProducts = true; 
    apexOrderBy=''
    pricebookFound = false; 
    priceBookDropStyle = 'slds-listbox slds-listbox_vertical slds-dropdown noOffSet'
    loaded = false; 
    colList = columns; 
    data = [];
    selectedRows = [];
    selectedPriceBookId = [];
    btnText = 'Add Products'; 
    @track displayText = []; 
    connectedCallback() {
        this.handleAllPriceBooks();
        this.loaded = true; 
    }
    
    
    handleClear(mess){
        let clearWhat = mess.detail; 
        switch(clearWhat){
            case 'product':
                this.product2Id = '';
                this.template.querySelector('c-product2-look-up').handleClearPBE();
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

    handleProduct(mess){
        this.product2Id = mess.detail; 
        this.addProduct(); 
    }

    handlePriceBook(mess){
        this.priceBookId = mess.detail.id;
        this.priceBookName = mess.detail.name; 
        this.pricebookFound = true; 
    }

    moveScreen(){
        switch(this.btnText){
            case 'Add Products':
                this.btnText = 'Save and Close';
                //this.selectedPriceBookId = this.selectedRows.map(x=>x.Id)
                this.pricebookFound = true; 
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
                this.newProds[index].UnitPrice = evt.detail.value;
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