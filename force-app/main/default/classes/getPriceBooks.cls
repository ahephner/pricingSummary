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
    
        @auraEnabled
    public static list<pricebookentry> getBestPriceString(list<string> priceBooksAcc, string priceField, string productId, string orderBy){
        list<string> pb = priceBooksAcc; 
        string find = 'select Floor_Price__c, Level_One_Margin__c, Level_1_UserView__c, Level_2_Margin__c, Level_2_UserView__c,Product2.Name, Product2.ProductCode, ' 
           + 'Pricebook2Id, UnitPrice, Product_Cost__c, Price_Book_Name__c,Name, Pricebook2.IsStandard,ProductCode, Floor_Margin__c,' 
            +' Min_Margin__c from PricebookEntry'
        + ' where IsActive = true and Pricebook2Id IN (\''+String.join(priceBooksAcc,'\',\'')+'\') and  Product2ID=\''+ productId+ '\''; 
        find += orderBy;     
        //if(limitor> 0){
          //  find += 'limit '+= limitor
        //}
	system.debug(find); 
        list<pricebookentry> bestPrice = Database.query(find);
        return bestPrice; 
    }
    //get product price; 
   @auraEnabled
    public static list<pricebookentry> getProductPrice(string productId, string priceField,  string orderBy){
     
        string find = 'select Floor_Price__c, Level_One_Margin__c, Level_1_UserView__c, Level_2_Margin__c, Level_2_UserView__c,Product2.Name, Product2.ProductCode, ' 
           + 'Pricebook2Id, UnitPrice, Product_Cost__c, Price_Book_Name__c,Name, Pricebook2.IsStandard,ProductCode,'
           + 'Floor_Margin__c, Min_Margin__c from PricebookEntry'
        + ' where IsActive = true and Product2ID=\''+ productId+ '\''; 
        find += orderBy;     
        system.debug(find); 
        //if(limitor> 0){
          //  find += 'limit '+= limitor
        //}

        list<pricebookentry> bestPrice = Database.query(find);
        return bestPrice; 
    }
    @auraEnabled
    public static string savePBE(list<pricebookentry> entries){
        system.debug(entries);
        update entries; 
        return 'success'; 
    }
}