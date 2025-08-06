public with sharing class multiplePriceBookCheck {
 public class ProductPricing {
        public Id productId;
        public Id pricebookEntryId;
        public Decimal unitPrice;
        public Id pricebook2Id;
        public Boolean isStandardPrice;

        public ProductPricing(Id productId, Id pricebookEntryId, Decimal unitPrice, Id pricebook2Id, Boolean isStandardPrice) {
            this.productId = productId;
            this.pricebookEntryId = pricebookEntryId;
            this.unitPrice = unitPrice;
            this.pricebook2Id = pricebook2Id;
            this.isStandardPrice = isStandardPrice;
        }
    }

    public static Map<Id, ProductPricing> getProductPricing(List<Id> productIds, List<Id> pricebook2Ids) {
        Map<Id, ProductPricing> result = new Map<Id, ProductPricing>();

        // Query custom pricebook entries
        Map<Id, List<PricebookEntry>> productToEntries = new Map<Id, List<PricebookEntry>>();
        for (PricebookEntry pbe : [
            SELECT Id, Product2Id, Pricebook2Id, UnitPrice
            FROM PricebookEntry
            WHERE Product2Id IN :productIds AND Pricebook2Id IN :pricebook2Ids AND IsActive = true
        ]) {
            if (!productToEntries.containsKey(pbe.Product2Id)) {
                productToEntries.put(pbe.Product2Id, new List<PricebookEntry>());
            }
            productToEntries.get(pbe.Product2Id).add(pbe);
        }

        // Get standard price book Id
        Id standardPBId = [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1].Id;

        // Query standard price book entries for fallback
        Map<Id, PricebookEntry> standardEntries = new Map<Id, PricebookEntry>();
        for (PricebookEntry stdPbe : [
            SELECT Id, Product2Id, UnitPrice
            FROM PricebookEntry
            WHERE Product2Id IN :productIds AND Pricebook2Id = :standardPBId AND IsActive = true
        ]) {
            standardEntries.put(stdPbe.Product2Id, stdPbe);
        }

        // Build result
        for (Id productId : productIds) {
            if (productToEntries.containsKey(productId) && !productToEntries.get(productId).isEmpty()) {
                // Pick first found pricebook entry
                PricebookEntry pbe = productToEntries.get(productId)[0];
                result.put(productId, new ProductPricing(productId, pbe.Id, pbe.UnitPrice, pbe.Pricebook2Id, false));
            } else if (standardEntries.containsKey(productId)) {
                PricebookEntry stdPbe = standardEntries.get(productId);
                result.put(productId, new ProductPricing(productId, stdPbe.Id, stdPbe.UnitPrice, standardPBId, true));
            }
        }

        return result;
    }
}