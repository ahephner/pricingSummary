import { LightningElement,api } from 'lwc';

export default class DisplayTable extends LightningElement {
     prods; 

    @api  
    get take(){
        return this.prods; 
    }
    set take(take){
        this.prods = [...take]; 
        console.log(this.prods)
    }
    products
   handleClick(){
    this.products = [...this.take];
   }
}