public class getPriceBooks_CR {
    @AuraEnabled
    public static SavePBEResponse savePBE(List<PricebookEntry> entries) {
        SavePBEResponse PBEResponse = new SavePBEResponse();
        List<String> errors = new List<String>();
        List<PricebookEntry> duplicates = new List<PricebookEntry>();
        Integer duplicateCheck = 0;
        Boolean successCheck = false;

        if (entries == null || entries.isEmpty()) {
            errors.add('Entry is Empty');
            PBEResponse.status = 'error';
            PBEResponse.message = 'No entries provided.';
            PBEResponse.errors = errors;
            return PBEResponse;
        }

        try {
            Database.UpsertResult[] results = Database.upsert(entries, false);
			// runs through all upserts to see if it succeeded
            for (Integer i = 0; i < results.size(); i++) {
                if (!results[i].isSuccess()) {
                    system.debug('res -> '+ results);
                    for (Database.Error err : results[i].getErrors()) {
                        errors.add('Row ' + i + ': ' + err.getMessage());
							
                        // Check if it's a duplication error and track the entry FIELD_INTEGRITY_EXCEPTION StatusCode.DUPLICATE_VALUE
                        if (err.getStatusCode() == StatusCode.FIELD_INTEGRITY_EXCEPTION ) {
                            system.debug(err.getStatusCode()+ ' error status');
                            duplicates.add(entries[i]);
                            duplicateCheck++;
                            
                        }
                    }
                } else {
                    successCheck = true; 
                }
            }
			 
            if (errors.isEmpty()) {
                PBEResponse.status = 'Success';
                PBEResponse.message = 'All entries saved!';
            } else if(duplicateCheck != 0 && successCheck == true){
                errors.add('Success with Duplicates');
                PBEResponse.status = 'Success with Dupes';
                PBEResponse.message = 'Some entries were Duplicates.';
            } else {
                errors.add('Failed');
                PBEResponse.status = 'failed';
                PBEResponse.message = 'All Entries failed to save';
            }

            PBEResponse.errors = errors;
            // To See what Duplicates are Added and are able to be called
            PBEResponse.duplicates = duplicates;
            return PBEResponse;

        } catch (Exception e) {
            System.debug(e);
            errors.add(String.valueOf(e.getMessage()));
            PBEResponse.status = 'error';
            PBEResponse.message = 'Exception occurred during upsert.';
            PBEResponse.errors = errors;
            return PBEResponse;
        }
    }

    public with sharing class SavePBEResponse {
        // To Recieve Information based on the Corresponding Names
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public String message { get; set; }
        @AuraEnabled public List<String> errors { get; set; }
		// To Check What the Duplicates Failed //
        @AuraEnabled public List<PricebookEntry> duplicates { get; set; }
    }
}