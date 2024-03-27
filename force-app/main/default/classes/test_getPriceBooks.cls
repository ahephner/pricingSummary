@isTest
public class test_getPriceBooks {
@isTest
    static void Test_getPriceBookIds(){
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        cust.Buyer_Account_Created__c = true;
        insert cust;
        
        BuyerAccount ba = new BuyerAccount(BuyerId= cust.Id,BuyerStatus='Active', CommerceType= 'Buyer', IsActive=true, Name='Aj Account');
        insert ba; 
        // standard pricebook
        Id pricebook = Test.getStandardPricebookId();
        //custom
        PriceBook2 pb2=new PriceBook2();
        pb2.Name = 'test';
        pb2.IsActive = true;
        //custom 3
        PriceBook2 pb3=new PriceBook2();
        pb3.Name = 'book 2';
        pb3.IsActive = true;
        insert pb3;
		//product
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        
        //Standard pricebook entry        
        PricebookEntry stpbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe; 
        //pricebook entry        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=prod.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        
        PricebookEntry pbe3 = new PricebookEntry(Pricebook2Id = pb3.Id, Product2Id=prod.id,
                                                 unitprice=110, IsActive = True, UseStandardPrice=False);
        insert pbe3; 
        //buyer group
        BuyerGroup bg = new BuyerGroup(Name='Group', Role='AccountBased'); 
        insert bg; 
        //buying group member
        BuyerGroupMember bgm = new BuyerGroupMember(BuyerGroupId = bg.Id, BuyerId = cust.Id); 
        insert bgm; 
        //buyer group pricebook
        BuyerGroupPricebook bgpb = new BuyerGroupPricebook(BuyerGroupId = bg.Id, isActive= true, Pricebook2Id = pb3.Id); 
        insert bgpb;
        
        //create list of price book entry strings
        list<string> priceBookIds = new list<string>(); 
        priceBookIds.add(pricebook);
        priceBookIds.add(pb2.id);
        priceBookIds.add(pb3.id);
        test.StartTest();
        	list<buyergrouppricebook> priceBooks = getPriceBooks.getPriceBookIds(cust.Id);
        	list<pricebookentry> pricing =  getPriceBooks.getBestPrice(priceBookIds, prod.Id); 
        test.stopTest();
        
        
    }
    
    @isTest
    static void Test_getPriceBookStrings(){
                //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        cust.Buyer_Account_Created__c = true;
        insert cust;
        
        BuyerAccount ba = new BuyerAccount(BuyerId= cust.Id,BuyerStatus='Active', CommerceType= 'Buyer', IsActive=true, Name='Aj Account');
        insert ba; 
        // standard pricebook
        Id pricebook = Test.getStandardPricebookId();
        //custom
        PriceBook2 pb2=new PriceBook2();
        pb2.Name = 'test';
        pb2.IsActive = true;
        //custom 3
        PriceBook2 pb3=new PriceBook2();
        pb3.Name = 'book 2';
        pb3.IsActive = true;
        insert pb3;
		//product
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        
        //Standard pricebook entry        
        PricebookEntry stpbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe; 
        //pricebook entry        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=prod.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        
        PricebookEntry pbe3 = new PricebookEntry(Pricebook2Id = pb3.Id, Product2Id=prod.id,
                                                 unitprice=110, IsActive = True, UseStandardPrice=False);
        insert pbe3; 
        //buyer group
        BuyerGroup bg = new BuyerGroup(Name='Group', Role='AccountBased'); 
        insert bg; 
        //buying group member
        BuyerGroupMember bgm = new BuyerGroupMember(BuyerGroupId = bg.Id, BuyerId = cust.Id); 
        insert bgm; 
        //buyer group pricebook
        BuyerGroupPricebook bgpb = new BuyerGroupPricebook(BuyerGroupId = bg.Id, isActive= true, Pricebook2Id = pb3.Id); 
        insert bgpb;
        
        //create list of price book entry strings
        list<string> priceBookIds = new list<string>(); 
        priceBookIds.add(pricebook);
        priceBookIds.add(pb2.id);
        priceBookIds.add(pb3.id);
        
        //order by string
        string order = 'Order By UnitPrice ASC'; 
        //field to search
        string field = 'UnitPrice'; 
        test.StartTest();
        	list<pricebookentry> strOne =  getPriceBooks.getBestPriceString(priceBookIds,  field, prod.id, order);
         	list<pricebookentry> strTwo =  getPriceBooks.getProductPrice(prod.id, field, order);
        	list<pricebookentry> strThree = getPriceBooks.checkPriceBooks(pb3.Id, prod.id, order); 
        test.StopTest();
    }
    
    @isTest
    static void Test_saveInfo(){
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        cust.Buyer_Account_Created__c = true;
        insert cust;
        	
        // standard pricebook
        Id pricebook = Test.getStandardPricebookId();
        //custom
        PriceBook2 pb2=new PriceBook2();
        pb2.Name = 'test';
        pb2.IsActive = true;
        //custom 3
        PriceBook2 pb3=new PriceBook2();
        pb3.Name = 'book 2';
        pb3.IsActive = true;
        insert pb3;
		//product
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        
        //Standard pricebook entry        
        PricebookEntry stpbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe; 
        //pricebook entry        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=prod.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        
        PricebookEntry pbe3 = new PricebookEntry();
        pbe3.Pricebook2Id = pb3.Id; 
        pbe3.Product2Id=prod.id;
        pbe3.unitprice=110; 
        pbe3.IsActive = True; 
        pbe3.UseStandardPrice=False;
        insert pbe3; 

        
        //create list of price book entry strings
        list<pricebookentry> pbes = new list<pricebookentry>(); 
        pbes.add(pbe); 
        pbes.add(pbe3);
        
        test.StartTest();
        	string messBack = getPriceBooks.savePBE(pbes);
        test.StopTest(); 
    }
    
      @isTest
    static void Test_getInfo(){
        //date
        date twoOneDaysAgo = Date.today() - 21; 
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.RecordTypeId = '01241000001Dy64AAC'; 
        cust.Customer_Name__c = 'Test Customer 123456';
        cust.Buyer_Account_Created__c = true;
        insert cust;
        
        //recordtypeid 
        string recType = [select id from recordtype where name = 'CPQ' ].Id; 
        //product2
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock',
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        //ats product
        product__c atsProd = new product__c(Name=prod.ProductCode, Product_Name__c = prod.Name,Product_Code__c=prod.ProductCode, Active__c = true  );
        insert atsProd; 
        
        // standard pricebook
        Id pricebook = Test.getStandardPricebookId();
        
        //Standard pricebook entry        
        PricebookEntry stpbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe; 
        system.debug(cust); 
        //Open Order required order #, customer open doc #
        Open_Order__c openHeader = new Open_Order__c(Name='Open Order', Open_Doc__c='SO789', Customer__c = cust.id );
        insert openHeader; 
        //open order detail required open order product open order detail name unit price gp dex id
        Open_Order_Detail__c openDetail = new Open_Order_Detail__c(Open_Order__c = openHeader.Id,Product__c =atsProd.id, Unit_Price__c = prod.Floor_Price__c, GP_Dex_ID__c='SO789 Line 1');
        insert openDetail;
        //sales doc required sales document name customer doc type=invoice sales doc # # of payments doc date
        Sales_Document__c salesHeader = new Sales_Document__c(Name='SO123', Customer__c= cust.Id, Doc_Type__c= 'Invoice',Sales_Doc_Num__c='SO123', Number_of_Payments__c=1, doc_date__c =twoOneDaysAgo ); 
        insert salesHeader; 
        //sales detail required Sales Doc Detail Name sales document product unit price
        Sales_Doc_Detail__c salesDetails = new Sales_Doc_Detail__c(name='SO123 Line 1',	Sales_Document__c=salesHeader.Id,Product__c=atsProd.Id, Unit_Price__c = prod.Floor_Price__c); 
        //opportunity required account, stage, closedate, name, location
        Opportunity op = new Opportunity(AccountId=cust.id, StageName='Working',recordtypeId = recType, CloseDate=twoOneDaysAgo, name='Opp', Pricebook2Id=pricebook);
        insert op; 
        //opportunitylineitem required name unitprice, cpq unit price, account, OpportunityId, Product2Id
         OpportunityLineItem opLineItem = new OpportunityLineItem(CPQ_Unit_Price__c=prod.Floor_Price__c, unitprice=prod.Floor_Price__c, Quantity= 1, 
                                                                  Account__c=cust.Id,OpportunityId=op.Id, Product2Id = prod.Id, PricebookEntryId = stpbe.Id  );
        insert opLineItem; 
        
        test.startTest(); 
        	  getPriceBooks.pricingWrapper pw = getPriceBooks.getCurrentInfo(prod.Id);
        test.stopTest();
    }
}