@isTest
public class test_omsOppUpdatePricing {
@TestSetup static void setUp(){
         DateTime dt = DateTime.newInstance(2025, 5, 15, 12, 30, 0);
        
        //create user
        // Define the user profile
		Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];

		// Create the user
		User newUser = new User(
    							FirstName = 'Test',
    							LastName = 'User',
    							Alias = 'tuser',
    							Email = 'alexabbyhephner@example.com',
    							Username = 'alexabbyhephner@example.com',  // Username should be in the form of an email
    							EmailEncodingKey = 'UTF-8',
    							LanguageLocaleKey = 'en_US',
    							LocaleSidKey = 'en_US',
    							TimeZoneSidKey = 'America/Los_Angeles',
    							ProfileId = p.Id
								);

								insert newUser;
        
         //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
		
    //create test customer and then set as a buyer account
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
    
    	BuyerAccount BA = new BuyerAccount();
    	BA.BuyerId = cust.Id;
    	BA.BuyerStatus = 'Active';
    	BA.IsActive = True;
    	BA.Name = cust.Name;
    	insert BA; 
    
    //Customer no Buyer Account
        Account cust2 = new Account();
        cust2.Name = 'Test99';
        cust2.Type = 'Customer';
        cust2.Customer_Name__c = 'Golf Courst 99';
        insert cust2;
        
        //location
        Schema.Location warehouse = new Schema.Location();
        warehouse.Name= 'ATS Warehouse';
        warehouse.Location_Number__c ='2';
        warehouse.IsInventoryLocation = true; 
        warehouse.LocationType = 'ATS'; 
        
        insert warehouse; 
    
    //webstore
        WebStore store = new WebStore();
        store.Name = 'ATS B2B Store';
        store.SupportedLanguages = 'en_US';
        store.MaxValuesPerFacet = 100;
        store.DefaultLanguage = 'en_US';
        store.PricingStrategy = 'Priority';
        store.PaginationSize = 20;
        insert store;
        
        //Product
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Herbicide - Premium', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 1); 
        insert prod;
                //Product
        product2 prod2 = new product2(name ='roundup', IsActive= True, ProductCode='456', Product_Status__c ='Stock', 
                                    Subcategory__c='Herbicide - Premium', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 1); 
        insert prod2;

//standard price book 
        Id pricebook = Test.getStandardPricebookId();
                //Standard pricebook entry        
        PricebookEntry stpbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe;
        
                //Standard pricebook entry        
        PricebookEntry stpbe2 = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod2.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert stpbe2;
//Non Standard Price Book
		PriceBook2 groupPriceBook = new PriceBook2();
    	groupPriceBook.Name = 'Group Shared Pricing';
    	groupPriceBook.IsActive = True; 
    	insert groupPriceBook;

//Insert a product
    	PricebookEntry nonStPBE = new PricebookEntry(Pricebook2Id = groupPriceBook.Id, Product2Id=prod.id,
                                                 unitprice=90, IsActive = True, UseStandardPrice=False);
        insert nonStPBE;
//Buyer Group
    	BuyerGroup bg = new BuyerGroup(name='buying group');
    	insert bg; 
        
 //create buyer group price book set priority here
        BuyerGroupPricebook bgmpb = new BuyerGroupPricebook(IsActive=true, BuyerGroupId = bg.Id, Pricebook2Id = groupPriceBook.Id, priority = 3 );
            insert bgmpb;
                 
    	//get recordtype
 		//production 0122M000001ElAYQA0
 		//sandbox 01275000000CgcYAAS
        //create test opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebook ,recordTypeId= '01275000000CgcYAAS',
                                         stagename='Working', closedate = myDate, Warehouse__c = warehouse.Id, Order_Type__c='EOP', Ship_Type__c='DS');
    insert opp; 
        //opportunitylineitem
        opportunitylineitem li = new opportunitylineitem(opportunityid = opp.id, product2id = prod.Id, PricebookEntryId=stpbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c= 4, CPQ_Margin__c=100); 
        insert li; 
        opportunitylineitem widgetli = new opportunitylineitem(opportunityid = opp.id, product2id = prod2.Id, PricebookEntryId=stpbe2.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00); 
        insert widgetli;
    }
	@isTest
    static void test_pricebookFound(){
        Pricebook2 accountPB = new Pricebook2(name='1001', isActive=true);
        insert accountPB; 
        
        product2 prod = [select id from Product2 where name='product'];
        //pricebookentry 
        PricebookEntry pbe = new PricebookEntry(IsActive = true, Product2Id=prod.id, Pricebook2Id= accountPB.Id, unitPrice = 1); 
        insert pbe; 
        
        Id oppId = [select id from Opportunity where name = 'test name'].Id;
        
        list<OpportunityLineItem> items = [Select product2Id,CPQ_Unit_Price__c  from OpportunityLineItem where OpportunityId =: oppId];
        
        test.startTest();
        	string one = omsOppUpdatePricing.pricebookFound(accountPB.Id,items );
        test.stopTest();
        
    }
    @isTest
    static void createAllTheThings(){
        list<account> acc = [select id, name from account where name='Test99'];
        string accountName = acc[0].Id; 
        Id oppId = [select id from Opportunity where name = 'test name'].Id;
        list<OpportunityLineItem> items = [Select product2Id,CPQ_Unit_Price__c  from OpportunityLineItem where OpportunityId =: oppId];
        
        test.startTest();
        string foxtwo = omsOppUpdatePricing.createAllTheThings(accountName, items);
        test.stopTest();
    }
    
    @isTest
    static void test_createSharePriceBook(){
        string name = 'group price';
        
        test.startTest();
        	omsOppUpdatePricing.createSharePriceBook(name);
        test.stopTest(); 
        
    }
    @isTest
    static void test_getAllSharedBooks(){
        string name = 'name';
        test.startTest();
        	list<BuyerGroupPricebook> bgpb = omsOppUpdatePricing.getAllSharedBooks();
        test.stopTest(); 
    }
    
    @isTest
    static void test_createGroupPriceBook(){
        list<string> buyers = new list<string>();
        string pbId = [select id from BuyerGroupPricebook where Pricebook2.Name ='Group Shared Pricing'].Id; 
        string buyersId = [select id from account where name ='Test123456' limit 1].Id; 
        buyers.add(buyersId);
        list<BuyerAccount> newBuyer = new list<BuyerAccount>(); 
        for(Account x : [select id, Name from account where name = 'Test99']){
            BuyerAccount ba = new BuyerAccount();
            ba.BuyerId = x.Id;
            ba.BuyerStatus = 'Active';
            ba.IsActive = true;
            ba.Name = x.Name; 
            newBuyer.add(ba);
        }
        
        test.startTest();
        	string back = omsOppUpdatePricing.createGroupPriceBook(pbId, buyers, newBuyer);
        test.stopTest();
    }
}