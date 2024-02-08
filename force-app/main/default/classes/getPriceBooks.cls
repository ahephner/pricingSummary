public with sharing class getPriceBooks {
    @AuraEnabled(cacheable=true)
  public static list<buyergrouppricebook> getPriceBookIds(string accountId){
        list<String> multiGroups = new list<string>();        
            for(buyergroupmember x: [select buyergroupid, name from buyergroupmember where buyerid =: accountId ]){
                multiGroups.add(x.buyergroupid);
            }
            list<buyergrouppricebook> pricebookIds = new list<buyergrouppricebook>();
            if(multiGroups.size()>0){
                
                //limit to active price book
                for(buyergrouppricebook y: [select Pricebook2Id, Pricebook2.Name, Name from buyergrouppricebook where buyergroupid IN: (multiGroups)]){
                    system.debug('y '+ y); 
                    
                    pricebookIds.add(y);
                }
           } 
        return pricebookIds; 
         
    }
    
    @auraEnabled(cacheable=true)
    public static list<pricebookentry> getBestPrice(list<string> priceBookIds, string productId, string fieldType){
        list<string> pb = priceBookIds; 
        list<pricebookentry> bestPrice = [select Pricebook2.Name,Pricebook2.IsStandard, UnitPrice  from PricebookEntry 
                                          where IsActive = true and Pricebook2Id in: (pb) and Product2ID=: productId 
                                         ORDER BY UnitPrice ASC limit 1];
        return bestPrice; 
    }
    
        @auraEnabled(cacheable=true)
    public static list<pricebookentry> getBestPriceString(list<string> priceBooksAcc, string priceField, string productId, string orderBy){
        list<string> pb = priceBooksAcc; 
        string find = 'select '+ priceField+', Pricebook2.Name, Pricebook2.IsStandard from PricebookEntry'
        + ' where IsActive = true and Pricebook2Id IN (\''+String.join(priceBooksAcc,'\',\'')+'\') and  Product2ID=\''+ productId+ '\''; 
        find += orderBy;     
        //if(limitor> 0){
          //  find += 'limit '+= limitor
        //}
system.debug(find); 
        list<pricebookentry> bestPrice = Database.query(find);
        return bestPrice; 
    }
}