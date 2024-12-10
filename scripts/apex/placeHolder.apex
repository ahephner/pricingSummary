   @AuraEnabled
    public static string createGroupPriceBook(string priceBookId, list<string> alreadyBuyers, list<BuyerAccount> newBuyers){
        //Rollback point
        Savepoint sp = Database.setSavepoint();
        string messBack;
        try{
            list<BuyerGroupMember> newMembers = new list<BuyerGroupMember>(); 
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
                    system.debug(sr.BuyerID + '  groupId => '+buyerGroupId); 
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