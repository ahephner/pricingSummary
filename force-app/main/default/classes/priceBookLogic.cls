public with sharing class priceBookLogic {
   
    public with sharing class priceBookEntryInfo{
        @AuraEnabled 
        public list<PricebookEntry> inBooks {get; set;}
        @AuraEnabled 
        public PricebookEntry standardPrice {get; set;}
    }
   
    @AuraEnabled
    public static PricebookEntryInfo findNewGetPrice(list<String> PriceBookIds, string ProductId){
        PricebookEntryInfo back = new PricebookEntryInfo();
        string standardId = '01s410000077vSKAAY'; 
        try {
            //here is the standard price
            List<PriceBookEntry> std = [select Id, UnitPrice, Agency_Product__c, Floor_Price__c, Product_Cost__c, Pricebook2.Name, Product2.ERP_Name__c
                                        from PriceBookEntry where Product2Id =:ProductId and Pricebook2Id =:standardId limit 1];

            List<PriceBookEntry> inList = [select Id, Pricebook2Id, Product2.ERP_Name__c, Pricebook2.Name,
                                          Agency_Product__c from PricebookEntry where Product2Id =:ProductId and Pricebook2Id IN: PriceBookIds ];

            back.inBooks = inList;
            back.standardPrice = std[0]; 
            return back; 

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}