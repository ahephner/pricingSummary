import { api } from "lwc";
import LightningModal from 'lightning/modal';
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
    handleChange(evt){
        this.value = evt.detail.value
        let index = this.options.findIndex(x => x.value === this.value)
        this.fieldLabel =  `Set ${this.options[index].label}`
        this.showPercentIncrease = this.value != '' ? true : false; 
    }

    showNumbInput = ''; 
    //here we spread the values from the display table
    copyData;
    handlePercentChange(evt){
        this.upDown = evt.detail.value; 
        this.showNumbInput = this.upDown != ''? true:false;
        
    }
    
    handleNumber(evt){
        this.numberInput = evt.detail.value; 
    }
    async handlePreview(){
        this.loading = true;
        this.gatherScreen = false;
        this.copyData =  JSON.parse(JSON.stringify(this.fetchedData));
        let fieldToUpdate = this.value
        for(let i=0; i<this.copyData.length; i++){
            this.copyData[i].fieldToUpdate = Number(this.numberInput); 
        }
        console.log(this.copyData)
        this.loading = false; 
    }

    handleClose(){
        this.close('update');
    }
}