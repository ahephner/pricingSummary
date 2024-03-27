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
            {label:'List Margin', value:'List_Margin__c'},
            //{label:'Floor Price', value:'Floor_Price__c'},
            //{label:'Min Margin', value:'Min_Margin__c'}
        ]
    }
    get twoOptions(){
        return [
            {label:'Set Direct', value:'SetDirect'},
            {label:'Increase % Value', value:'Up'},
            {label:'Decrease % Value', value:'Down'}
        ]
    }
    handleLabel(field, typeOfChange){
        if(field!=undefined && typeOfChange != undefined){
            let label; 
            switch(typeOfChange){
                case 'Set Direct':
                    label = `Set ${field} directly`
                    break;
                case 'Increase % Value':
                    label = `Increase ${field} by`
                    break;
                case 'Decrease % Value':
                    label = `Decrease ${field} by` 
                    break;
                default:
                    console.log('notta');    
        }
        return label; 
    }
    }
    inputLabel; 
    handleChange(evt){
        this.value = evt.detail.value
        let index = this.options.findIndex(x => x.value === this.value)
        this.inputLabel = this.options[index].label
        this.fieldLabel = this.handleLabel(this.inputLabel, this.inputLabelType);
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
        this.fieldLabel = this.handleLabel(this.inputLabel, this.inputLabelType)
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
                console.log(this.copyData)
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
    //commented out are for if we need to update product2 which is seperate obj. Not needed for counters
    handleDirect(data, field){
        for(let i=0; i< data.length; i++){
            //data[i].updateProd2 = field ==='Floor_Price__c' ? true : false; 
            data[i].isEdited = true;
            data[i].prevVal =data[i][field]; 
            data[i].UnitPrice = field === 'UnitPrice' ? Number(this.numberInput): roundNum((data[i].Product_Cost__c/(1-(Number(this.numberInput)/100))),2); 

            data[i].List_Margin__c = field === 'UnitPrice' ? roundNum(((data[i][field] - data[i].Product_Cost__c)/data[i][field] *100),2) : Number(this.numberInput); 

            data[i].changeVal = data[i].prevVal > data[i][field] ? roundNum(data[i][field] - data[i].prevVal,2): roundNum(data[i][field]- data[i].prevVal,2);
            //data[i].Floor_Margin__c = field === 'Floor_Price__c' ? roundNum(((data[i][field] - data[i].Product_Cost__c)/data[i][field] *100),2) : data[i].Floor_Margin__c;    
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = field === 'UnitPrice' ? `$${data[i].UnitPrice}`: `${data[i].List_Margin__c}%`;
            data[i].prevValToShow = field === 'UnitPrice' ? `$${data[i].prevVal}`: `${data[i].prevVal}%`
            console.log('cost ',data[i].Product_Cost__c ,' List_Margin__c ',data[i].List_Margin__c, ' UnitPrice ', data[i].UnitPrice)
        }   
        return data
    }

    handleMargUp(data, field){
        let numb = field === 'UnitPrice' ? Number(this.numberInput/100) : Number(this.numberInput);
        for(let i=0; i<data.length;i++){
            //set vars for better reading calcs
            //new increased value
            let increaseVal = field === 'UnitPrice' ? roundNum(data[i][field] + (data[i][field] * numb),2): roundNum(data[i][field] + numb,2)
            //previous list price and marign
            let prevUP = data[i].UnitPrice
            let prevLM = data[i].List_Margin__c
            //start previous field value.
            let prevVal = data[i][field]

            //data[i].updateProd2 = field ==='Floor_Price__c' ? true : false;
            data[i].isEdited = true;
            data[i].changeVal = prevVal < increaseVal ? roundNum(increaseVal - prevVal,2): roundNum(increaseVal + prevVal,2); 
            //data[i].Floor_Margin__c = field === 'Floor_Price__c' ? roundNum(((data[i][field] - data[i].Product_Cost__c)/data[i][field] *100),2) : data[i].Floor_Margin__c;
            data[i].List_Margin__c = field === 'UnitPrice' ? roundNum(((increaseVal - data[i].Product_Cost__c)/increaseVal *100),2) : increaseVal; 
    
            data[i].UnitPrice = field === 'UnitPrice' ? increaseVal : roundNum((data[i].Product_Cost__c/(1-(Number( prevLM+ increaseVal)/100))),2);
    
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = field === 'UnitPrice' ? `$${data[i].UnitPrice}`: `${data[i].List_Margin__c}%`; 
            data[i].prevValToShow = field === 'UnitPrice' ? `$${prevVal}`: `${prevVal}%`
            //console.log(`${data[i][field]} = (${data[i][field]} * ${numb}) =`,  data[i][field] + (data[i][field] * numb))
        }
        return data; 
    }
    handleMargDown(data, field){
        let numb = field === 'UnitPrice' ? Number(this.numberInput/100) : Number(this.numberInput);
        for(let i=0; i<data.length;i++){
            //set vars for better reading calcs
            //new increased value
            let increaseVal = field === 'UnitPrice' ? roundNum(data[i][field] - (data[i][field] * numb),2): roundNum(data[i][field] - numb,2)
            //previous list price and marign
            let prevUP = data[i].UnitPrice
            let prevLM = data[i].List_Margin__c
            //start previous field value.
            let prevVal = data[i][field]

            //data[i].updateProd2 = field ==='Floor_Price__c' ? true : false;
            data[i].isEdited = true;
            data[i].changeVal = prevVal < increaseVal ? roundNum(increaseVal + prevVal,2): roundNum(increaseVal - prevVal,2); 
            //data[i].Floor_Margin__c = field === 'Floor_Price__c' ? roundNum(((data[i][field] - data[i].Product_Cost__c)/data[i][field] *100),2) : data[i].Floor_Margin__c;
            data[i].List_Margin__c = field === 'UnitPrice' ? roundNum(((increaseVal - data[i].Product_Cost__c)/increaseVal *100),2) : increaseVal; 
    
            data[i].UnitPrice = field === 'UnitPrice' ? increaseVal : roundNum((data[i].Product_Cost__c/(1-(Number( prevLM+ increaseVal)/100))),2);
    
            data[i].colorClass = data[i].changeVal < 0 ? 'slds-text-color_error': 'slds-text-color_success'; 
            data[i].fieldToShow = field === 'UnitPrice' ? `$${data[i].UnitPrice}`: `${data[i].List_Margin__c}%`; 
            data[i].prevValToShow = field === 'UnitPrice' ? `$${prevVal}`: `${prevVal}%`
            //console.log(`${data[i][field]} = (${data[i][field]} * ${numb}) =`,  data[i][field] + (data[i][field] * numb))
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