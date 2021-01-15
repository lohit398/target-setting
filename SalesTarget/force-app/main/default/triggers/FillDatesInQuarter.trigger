trigger FillDatesInQuarter on Quarter__c (before insert) {
    
    
    List<Id> goalIds = new List<Id>();
    for(Integer i=0;i<trigger.new.size();i++){
    	goalIds.add(trigger.new[i].Goal_Name__c);  
    }
    
    List<Goal__c> goals = [Select Id,Financial_Year__r.From_Date__c,Financial_Year__r.To_Date__c  from Goal__c where Id IN : goalIds];
    
    Map<Id,Goal__c> goalsMap  = new Map<Id,Goal__c>();
    for(Goal__c goal:goals){
        goalsMap.put(goal.Id, goal);
    }
    
    for(Quarter__c quarter: trigger.new){
        //Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'
        if(quarter.Name == 'Quarter 1') {
            Date startDate = (goalsMap.get(quarter.Goal_Name__c).Financial_Year__r.From_Date__c);
            quarter.Start_Date__c = startDate;
           	Date endDate = startDate.addMonths(3);
            quarter.End_Date__c = endDate;
        }
        if(quarter.Name == 'Quarter 2') {
            Date startDate = (goalsMap.get(quarter.Goal_Name__c).Financial_Year__r.From_Date__c.addMonths(3).addDays(1));
            quarter.Start_Date__c = startDate;
           	Date endDate = startDate.addMonths(3);
            quarter.End_Date__c = endDate;
        }
          if(quarter.Name == 'Quarter 3') {
            Date startDate = (goalsMap.get(quarter.Goal_Name__c).Financial_Year__r.From_Date__c.addMonths(6).addDays(1));
            quarter.Start_Date__c = startDate;
           	Date endDate = startDate.addMonths(3);
            quarter.End_Date__c = endDate;
        }
        if(quarter.Name == 'Quarter 4') {
            Date startDate = (goalsMap.get(quarter.Goal_Name__c).Financial_Year__r.From_Date__c.addMonths(9).addDays(1));
            quarter.Start_Date__c = startDate;
           	Date endDate = startDate.addMonths(3);
            quarter.End_Date__c = endDate;
        }
    }
}