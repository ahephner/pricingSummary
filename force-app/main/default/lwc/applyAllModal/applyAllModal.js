import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
import {roundNum} from 'c/programBuilderHelper';
export default class ApplyAllModal extends LightningModal {
    @api averageUnitPrice;
    @api averageMarginUp;
    @api productCost; 
    @api fetchedData; 
    value = ''; 
    upDown;
    numberInput = 0;
    showPercentIncrease = false;  
    fieldLabel = '';
    gatherScreen = true; 
    loading = false; 
    whatHappened = '';

    get options(){
        return[
            {label:'Unit Price', value:'UnitPrice'},
            {label:'Floor Price', value:'Floor_Price__c'},
            //{label:'Floor Price', value:'Floor_Price__c'},
            {label:'Min Margin', value:'Min_Margin__c'}
        ]
    }
    get twoOptions(){
        return [
            {label:'Set Direct', value:'SetDirect'},
            {label:'Increase % Value', value:'Up'},
            {label:'Decrease % Value', value:'Down'}
        ]
    }

    inputLabel; 
    handleChange(evt){
        this.value = evt.detail.value
        let index = this.options.findIndex(x => x.value === this.value)
        this.inputLabel = this.options[index].label
        this.fieldLabel =  `Set ${this.options[index].label}`
        this.showPercentIncrease = this.value != '' ? true : false; 
    }
    
    inputLabelType
    showNumbInput = ''; 
    //here we spread the values from the display table
    @track copyData= [];
    handlePercentChange(evt){
        this.upDown = evt.detail.value; 
        let index = this.twoOptions.findIndex(x => x.value === this.upDown);
        this.inputLabelType = this.twoOptions[index].label
        this.showNumbInput = this.upDown != ''? true:false;
        
    }
    
    handleNumber(evt){
        this.numberInput = evt.detail.value; 
    }
    async handlePreview(){
        this.loading = true;
        this.gatherScreen = false;
        this.messageUser = this.upDown ==='SetDirect' ? `This is a preview of updating the ${this.inputLabel}. If you save the ${this.inputLabel} will be set to $${this.numberInput}` : 
                           this.upDown ==='Up' ? `This is a preview of updating the ${this.inputLabel} by increasing ${this.numberInput}%`:
                           `This is a preview of updating the ${this.inputLabel} by decreasing by ${this.numberInput}%`
        this.copyData =  JSON.parse(JSON.stringify(this.fetchedData));
        
         switch(this.upDown){
            case 'SetDirect':
                this.copyData = this.handleDirect(this.copyData, this.value); 
                break;
            case 'Up':
                this.copyData = this.handleMargUp(this.copyData, this.value);
                break;
            case 'Down':
                this.copyData = this.handleMargDown(this.copyData, this.value);
                break;
            default:
                console.log('notta');               
         }
         
        this.loading = false; 
    }
    handleDirect(data, field){
        for(let i=0; i< data.length; i++){
            data[i].updateProd2 = field ==='Floor_Price__c' ? true : false; 
            data[i].isEdited = true;
            data[i].prevVal = data[i][field]
            data[i][field] = Number(this.numberInput); 
            data[i].changeVal = data[i].prevVal > data[i][field] ? roundNum(data[i][field] - data[i].prevVal,2): roundNum(data[i][field]- data[i].prevVal,2);   
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = Number(this.numberInput)
        }   
        return data
    }

    handleMargUp(data, field){
        let numb = Number(this.numberInput/100)
        for(let i=0; i<data.length;i++){
            data[i].prevVal = data[i][field]
            data[i].updateProd2 = field ==='Floor_Price__c' ? true : false;
            data[i].isEdited = true;
            data[i][field] = roundNum(data[i][field] + (data[i][field] * numb),2);
            data[i].changeVal = data[i].prevVal > data[i][field] ? roundNum(data[i][field] - data[i].prevVal,2): roundNum(data[i][field]- data[i].prevVal,2); 
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = data[i][field] ; 
            //console.log(`${data[i][field]} = (${data[i][field]} * ${numb}) =`,  data[i][field] + (data[i][field] * numb))
        }
        return data; 
    }
    handleMargDown(data, field){
        let numb = Number(this.numberInput/100)
        for(let i=0; i<data.length;i++){
            data[i].updateProd2 = field ==='Floor_Price__c' ? true : false;
            data[i].isEdited = true; 
            data[i].prevVal = data[i][field];
            data[i][field] = roundNum(data[i][field] - (data[i][field] * numb),2);
            data[i].changeVal = data[i].prevVal > data[i][field] ? roundNum(data[i][field] - data[i].prevVal,2): roundNum(data[i][field]- data[i].prevVal,2); 
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = data[i][field]; 
        }
        return data;
    }
    
    removeLineItem(event){
        let index = this.copyData.findIndex(x=> x.Id === event.target.name)
        this.copyData.splice(index, 1);
        
    }

    handleSave(){
        //filter products
        //use shared apex to update
        //close screen return apex message
        this.close(this.copyData)
    }
    handleClose(){
        this.close('cancel');
    }
}