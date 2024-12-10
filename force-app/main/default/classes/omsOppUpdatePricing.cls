public class omsOppUpdatePricing {

    @AuraEnabled
    public static string pricebookFound(string pbId, list<OpportunityLineItem> prods){
        string messBack;
      
        map<id, OpportunityLineItem> product = new map<id, OpportunityLineItem>();
        list<pricebookentry> toUpsert = new list<pricebookentry>(); 
        try{
            for(OpportunityLineItem x:prods){
                product.put(x.Product2Id, x); 
            }
       
            for(pricebookentry a:[select id, UnitPrice, Product2Id from pricebookentry
                                  where Product2Id in: product.keySet() and Pricebook2Id =:pbId]){
                                      system.debug(product.get(a.Product2Id).CPQ_Unit_Price__c); 
                                      a.UnitPrice = product.get(a.Product2Id).CPQ_Unit_Price__c;
                                      toUpsert.add(a);
                                      product.remove(a.Product2Id); 
                                  }
            //check if any new products
            if(product.size()>0){
                for(Id y:product.keySet()){
                    pricebookentry np = new pricebookentry();
                    np.Product2Id = product.get(y).Product2Id;
                    np.UnitPrice = product.get(y).CPQ_Unit_Price__c;
                    np.Pricebook2Id = pbId; 
                    np.IsActive = true; 
                    toUpsert.add(np); 
                }
                 
            }
            upsert toUpsert;

            messBack= 'success';
        }catch(exception e){
            messBack = String.valueOf(e);
        }
        return messBack; 
    }
    //Need to check if they are a member of the web store. If not add them
    @AuraEnabled
    public static string createAllTheThings(string accountId, list<OpportunityLineItem> products){
        //Rollback point
        Savepoint sp = Database.setSavepoint();
        //message back to component
        string messBack;
        list<PricebookEntry> pbeList = new list<PricebookEntry>();
        id storeId = [select id from webstore where name = 'ATS B2B Store'].id; 
        try{
         //get account details
         list<account> acc=[select id, name from account where id =: accountId ]; 
        //create price book Account_Based__c=true, Priority_Price_Book__c=true
        Pricebook2 pb = new Pricebook2(name=acc[0].Name, isActive=true,  Account_Based_Price_Book__c=true);
            insert pb; 
        //create price book entries
            for(OpportunityLineItem x:products){
                PricebookEntry pbe = new PricebookEntry();
                pbe.Product2Id = x.Product2Id;
                pbe.UnitPrice = x.CPQ_Unit_Price__c;
                pbe.Pricebook2Id = pb.Id;
                pbe.IsActive = true;
                pbeList.add(pbe);
            }
            insert pbeList; 
         //create buyer account
         BuyerAccount ba = new BuyerAccount();
            ba.BuyerId = acc[0].Id;
            ba.BuyerStatus = 'Active';
            ba.IsActive = True;
            ba.Name = acc[0].Name; 
            insert ba; 
            system.debug('ba ' +ba); 
        //create buyer group
        BuyerGroup bg = new BuyerGroup(Name = acc[0].Name);  
        insert bg; 
        //create buyer group member
        BuyerGroupMember bgm = new BuyerGroupMember(BuyerId=acc[0].id, BuyerGroupId = bg.Id );
            insert bgm; 
        //create buyer group price book set priority here
        BuyerGroupPricebook bgmpb = new BuyerGroupPricebook(IsActive=true, BuyerGroupId = bg.Id, Pricebook2Id = pb.Id, priority = 2 );
            insert bgmpb; 
        //create webstore access
        WebStoreBuyerGroup webStore = new WebStoreBuyerGroup(BuyerGroupId=bg.Id, webStoreId = storeId);
            insert webStore; 
        messBack = 'New Price Book Created';
        }catch(exception e){
            Database.rollback(sp);
            messBack = string.valueOf(e);
            system.debug(messBack); 
        }

        return messBack;
    }
    
    ///SHARED PRICE BOOK LOGIC
     @AuraEnabled
    public static string createSharePriceBook(string name){
        string back; 
        try{
            string pbName = name;
        Pricebook2 pb = new Pricebook2(name=pbName, isActive=true,  Account_Based_Price_Book__c=true);
            insert pb; 
        //create buyer group
        BuyerGroup bg = new BuyerGroup(Name = pbName);  
        insert bg;
        
        //create buyer group price book set priority here
        BuyerGroupPricebook bgmpb = new BuyerGroupPricebook(IsActive=true, BuyerGroupId = bg.Id, Pricebook2Id = pb.Id, priority = 3 );
            insert bgmpb;
            back = 'success '+ pbName; 
        }catch(exception e){
            back = string.valueOf(e);
        }
		return back;         
        
    }
    
        //get all pricebooks for adding products to multiple price books
    @AuraEnabled(cacheable = true)
    public static list<BuyerGroupPricebook> getAllSharedBooks(){
        list<BuyerGroupPricebook> foundProducts = [SELECT Pricebook2.Name, IsActive, Pricebook2Id, Pricebook2.My_Price_Book__c FROM BuyerGroupPricebook 
                                                   WHERE isActive = true  AND Priority = 3];
        //and Pricebook2.My_Price_Book__c = true
        if(foundProducts.size()>0){
            return foundProducts;
        }else{
            return null; 
        }
    }
    @AuraEnabled
    public static string createGroupPriceBook(string priceBookId, list<string> alreadyBuyers, list<BuyerAccount> newBuyers){
        //Rollback point
        Savepoint sp = Database.setSavepoint();
        string messBack;
        try{
         
            list<BuyerGroupMember> newMembers = new list<BuyerGroupMember>(); 
            //careful we are not passing in the actual price book id here var is bad. Need to pass ID of the buyergroupPricebook
            Id buyerGroupId = [select id, BuyerGroupId from BuyerGroupPricebook where id =:priceBookId].BuyerGroupId;
            
            if(alreadyBuyers.size()>0){
                for(string x:alreadyBuyers){
                    BuyerGroupMember bgm = new BuyerGroupMember();
                    bgm.BuyerId = x;
                    bgm.BuyerGroupId = buyerGroupId;
                    newMembers.add(bgm); 
                }
            }

            //enable buyer accounts
            if(newBuyers.size()>0){
            	Database.SaveResult[] buyerGroups = Database.insert(newBuyers, true); 
                
                for(BuyerAccount sr:newBuyers){
                    BuyerGroupMember bgm = new BuyerGroupMember();
                    bgm.BuyerId = sr.BuyerId;
                    bgm.BuyerGroupId = buyerGroupId;
                    newMembers.add(bgm); 
                }
            }

            Database.SaveResult[] bgmInsert = Database.insert(newMembers, true);
            messBack = 'success';
        }catch(exception e){
            Database.rollback(sp);
            messBack = string.valueOf(e); 
            system.debug(messBack); 
        } 
        return messBack; 
        
    }
}