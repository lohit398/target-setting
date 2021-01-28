public class DE_UpdateGoalsWhenOppClosed_Helper {
    @future
    public static void updateQuarters(Map<Id,Double> updatedGoals,List<Id> oppIds){
        //List<Quarter__c> quarters = [SELECT Id,Goal_Name__c from Quarter__c where Goal_Name__c IN :updatedGoals];
        List<String> goalIds  = new List<String>();
        Map<Id,Quarter__c>  goals= new Map<Id,Quarter__c>();
        List<Quarter__c> updateRequired = new List<Quarter__c>();
        
        
        for (String goalId : updatedGoals.keySet()){
            //System.debug('field name is ' + goalId);
            goalIds.add(goalId);
        }
       Opportunity opp = [SELECT Id,CloseDate from Opportunity where Id= :oppIds[0]];
       List<Quarter__c> quarters = [Select Goal_Name__c,Name,Target_Achieved__c from Quarter__c where Goal_Name__c IN :goalIds AND Start_Date__c < :opp.CloseDate AND End_Date__c > :opp.CloseDate];
        for(Quarter__c q: quarters){
            goals.put(q.Goal_Name__c,q);
        }
        
         for (String goalId : updatedGoals.keySet()){
           	Quarter__c q = goals.get(goalId);
           	Double amount = updatedGoals.get(goalId);
            if(q.Target_Achieved__c != null)
            	q.Target_Achieved__c = q.Target_Achieved__c + amount;
             else
                 q.Target_Achieved__c = amount;
             
             updateRequired.add(q);
        }
        UPDATE updateRequired;
    }
}