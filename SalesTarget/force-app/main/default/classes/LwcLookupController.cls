public with sharing class LwcLookupController {
    @AuraEnabled(cacheable=true)  
   public static List<sobject> findRecords(String searchKey, String objectName) {  
     string searchText = '\'' + String.escapeSingleQuotes(searchKey) + '%\'';  
     string query = 'SELECT Id, Name FROM ' +objectName+ ' WHERE Name LIKE '+searchText+' LIMIT 6';  
     return Database.query('SELECT Id, Name FROM ' +objectName+ ' WHERE Name LIKE '+searchText+' LIMIT 6');  
   }  


   @AuraEnabled
   public static void createGoal(Goal__c goal){
       try{
           insert goal;
       } catch(Exception e){
           System.debug(e);
       }
   }
}