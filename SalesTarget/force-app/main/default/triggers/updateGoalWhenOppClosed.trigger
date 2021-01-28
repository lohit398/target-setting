trigger updateGoalWhenOppClosed on Opportunity (after update) {
    List<Goal__c> updateList = new List<Goal__c>();
    List<Double> amountUpdated = new List<Double>();
    Map<Id,Double> goalAmount = new Map<Id,Double>();
    //List<Id> owners= new List<Id>();
    Map<Id,Id> ownersAndFy = new Map<Id,Id>();
    List<Financial_Year__c> financialYears = [SELECT Id,From_Date__c,To_Date__c from Financial_Year__c];
    List<Id> opportunityIds = new List<Id>();
    List<Id> oppOwnerIds = new List<Id>();
    Map<Id,Double> userAreaTargets = new Map<Id,Double>();
    for(Integer z=0;z<trigger.new.size();z++){
        if(trigger.new[z].StageName  == 'Closed Won'){
            opportunityIds.add(trigger.new[z].Id);
            oppOwnerIds.add(trigger.new[z].OwnerId);
            userAreaTargets.put(trigger.new[z].OwnerId, trigger.new[z].Amount);
        }	
    }
    
    /*Get Products pertained to opportunities*/
    List<OpportunityLineItem> oppLineItems = [SELECT Product2Id,Name,Quantity,ListPrice,Product2.Family,OpportunityId,UnitPrice FROM OpportunityLineItem WHERE OpportunityId IN :opportunityIds];
    Map<String,Double> oppProducts = new Map<String,Double>();
    List<String> families = new List<String>();
    for(OpportunityLineItem oppLineItem: oppLineItems){
        if(oppProducts.get(oppLineItem.Product2.Family) != null){
            oppProducts.put(oppLineItem.Product2.Family ,oppProducts.get(oppLineItem.Product2.Family) + (oppLineItem.Quantity * oppLineItem.UnitPrice));
        }else{
            oppProducts.put(oppLineItem.Product2.Family, (oppLineItem.Quantity * oppLineItem.UnitPrice));
        }
        families.add(oppLineItem.Product2.Family);
    }
    List<Goal__c> familyGoals = [SELECT Id,Target_to_be_reached__c,Family_Area_Name__c,Target_Reached__c FROM Goal__c WHERE Family_Area_Name__c IN :families];
    System.debug(familyGoals);
    List<Goal__c> updateGoalsFamilies = new List<Goal__c>();
    for(Goal__c familyGoal: familyGoals){
        if(familyGoal.Target_Reached__c != null)
            familyGoal.Target_Reached__c = familyGoal.Target_Reached__c + oppProducts.get(familyGoal.Family_Area_Name__c);
        else
            familyGoal.Target_Reached__c = oppProducts.get(familyGoal.Family_Area_Name__c);
        updateGoalsFamilies.add(familyGoal);
    }
    if(!updateGoalsFamilies.isEmpty()){
        UPDATE updateGoalsFamilies;
    }
    
    /*Area Based roll-up (user based)*/
    List<User_Area__c> userAreas = [SELECT Id,Name,Area__c,Related_User__c,Area__r.Name FROM User_Area__c WHERE Related_User__c IN :oppOwnerIds];
    Map<String,Double> areaTargets = new Map<String,Double>();
    List<String> areas = new List<String>();
    for(User_Area__c userArea : userAreas){
        areaTargets.put(userArea.Area__r.Name,userAreaTargets.get(userArea.Related_User__c));
        areas.add(userArea.Area__r.Name);
    }
    List<Goal__c> areaGoals = [SELECT Id,Target_to_be_reached__c,Family_Area_Name__c,Target_Reached__c FROM Goal__c WHERE Family_Area_Name__c IN :areas];
	List<Goal__c> areaGoalsUpdate = new List<Goal__c>();
	for(Goal__c areaGoal: areaGoals){
        if(areaGoal.Target_Reached__c != null)
            areaGoal.Target_Reached__c = areaGoal.Target_Reached__c + areaTargets.get(areaGoal.Family_Area_Name__c);
        else
            areaGoal.Target_Reached__c = areaTargets.get(areaGoal.Family_Area_Name__c);
        areaGoalsUpdate.add(areaGoal);
    }
    if(!areaGoalsUpdate.isEmpty()){
        UPDATE areaGoalsUpdate;
    }    
    
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
        DE_UpdateGoalsWhenOppClosed_Helper.updateQuarters(goalAmount,oppIds);
    }
    
}