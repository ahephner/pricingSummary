import { LightningElement, api, wire} from 'lwc';
import getCurrentInfo from '@salesforce/apex/getPriceBooks.getCurrentInfo'
import {roundNum} from 'c/programBuilderHelper';
export default class PricingInfo extends LightningElement {
    @api unitPrice; 
    @api margin;
    @api productId; 
    avgUnitPrice
    avgOpenPrice
    avgQuotePrice
    @wire(getCurrentInfo,{prodId: '$productId'})
        wiredData(res){
            if(res.data){
                this.avgUnitPrice = roundNum(res.data.salesAVG[0]?.salesDoc ?? 0.00, 2);
                this.avgOpenPrice = roundNum(res.data.open[0]?.openOrder ?? 0.00,2); 
                this.avgQuotePrice = roundNum(res.data.oppLines[0]?.oppLineItem ?? 0.00,2);
            }
        }

}