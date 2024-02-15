
import LightningModal from 'lightning/modal';
export default class ApplyAllModal extends LightningModal {
    value = ''; 
    upDown = 'Up';
    numberInput = 0;
    showPercentIncrease = false;  
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
            {label:'Increase', value:'Up'},
            {label:'Decrease', value:'Down'}
        ]
    }
    handleChange(evt){
        this.value = evt.detail.value
        this.showPercentIncrease = this.value === 'Min_Margin__c' ? true : false; 
    }

    handlePercentChange(evt){
        this.upDown = evt.detail.value; 
    }
    handleOk(){
        console.log('hi')
        this.close('picked ', this.value);
    }
}