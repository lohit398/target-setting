trigger updateGoalWhenOppClosed on Opportunity (after update) {
    List<Goal__c> updateList = new List<Goal__c>();
    List<Double> amountUpdated = new List<Double>();
    Map<Id,Double> goalAmount = new Map<Id,Double>();
    //List<Id> owners= new List<Id>();
    Map<Id,Id> ownersAndFy = new Map<Id,Id>();
    List<Financial_Year__c> financialYears = [SELECT Id,From_Date__c,To_Date__c from Financial_Year__c];
    
    
    for(Integer k=0;k<trigger.new.size();k++){
        //owners.add(trigger.new[k].OwnerId);
        for(Integer z=0;z<financialYears.size();z++){
            if(trigger.new[k].CloseDate < financialYears[z].To_Date__c && trigger.new[k].CloseDate > financialYears[z].From_Date__c)
                ownersAndFy.put(trigger.new[k].OwnerId, financialYears[z].Id);
        }
    }
    
    List<Goal__c> goals = new List<Goal__c>();
    
    for (String ownerId : ownersAndFy.keySet()){
        goals.addAll([Select Id,Target_Reached__c,OwnerId,Parent_Goal__c from Goal__c where OwnerId =: ownerId AND Financial_Year__c=: ownersAndFy.get(ownerId)]);
    }
    
    for(Integer j=0;j<goals.size();j++){
        if(goals[j].Parent_Goal__c != null){
            Goal__c g = [SELECT Id,Parent_Goal__c,Target_Reached__c from Goal__c where Id = :goals[j].Parent_Goal__c];
            goals.add(g);
        }
        else{
            break;
        }
    }
    
    List<Id> oppIds = new List<Id>();
    for(Integer i=0;i<trigger.new.size();i++){
        if(trigger.new[i].StageName  == 'Closed Won'){
            for(Goal__c goal: goals){
                if(goal.Target_Reached__c != null)
                    goal.Target_Reached__c = goal.Target_Reached__c + trigger.new[i].Amount;
                else
                    goal.Target_Reached__c = trigger.new[i].Amount;
                
                amountUpdated.add(trigger.new[i].Amount);
                updateList.add(goal);
                oppIds.add(trigger.new[i].Id);
            }
        }
    }
    if(!updateList.isEmpty()){
        UPDATE updateList;
        for(Integer i=0;i<updateList.size();i++){
            //updatedListId.add(updateList[i].Id);
            goalAmount.put(updateList[i].Id,amountUpdated[i]);
        }
        for(Opportunity opp: trigger.new){
            
        }
        DE_UpdateGoalsWhenOppClosed_Helper.updateQuarters(goalAmount,oppIds);
    }
    
}