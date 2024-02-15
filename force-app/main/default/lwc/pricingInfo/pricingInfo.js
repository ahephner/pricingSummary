import { LightningElement, api } from 'lwc';

export default class PricingInfo extends LightningElement {
    @api unitPrice; 
    @api margin;
    @api productId; 
}