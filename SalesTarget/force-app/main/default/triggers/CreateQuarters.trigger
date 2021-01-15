trigger CreateQuarters on Goal__c (after insert,after update) {
    if(Trigger.IsInsert){
        List<Quarter__c> quarters = new List<Quarter__c>(); 
        for(Goal__c goal: trigger.New){
            if(goal.Goal_Period__c == 'Financial Year' && goal.Target_to_be_reached__c != null){
                Double target = goal.Target_to_be_reached__c / 4;
                for(Integer i=1;i<5;i++){
                    Quarter__c q = new Quarter__c();
                    q.Name = 'Quarter '+i;
                    q.Goal_Name__c = goal.Id;
                    q.Target_To_be_Reached__c = target;
                    q.OwnerId = goal.OwnerId;
                    quarters.add(q);
                }
            }
            else if(goal.Goal_Period__c != null && goal.Target_to_be_reached__c != null){
                Quarter__c quarter = new Quarter__c();
                quarter.Name = goal.Goal_Period__c;
                quarter.Goal_Name__c = goal.Id;
                quarter.Target_To_be_Reached__c = goal.Target_to_be_reached__c;
                quarter.OwnerId = goal.OwnerId;
                quarters.add(quarter);
            }
            
        }
        if(!quarters.isEmpty())
            INSERT quarters;
    }
    else if (Trigger.IsUpdate){
        List<Quarter__c> quarters = new List<Quarter__c>();
        
        for(Goal__c goal: trigger.New){
            List<Quarter__c> currentQuarters = [SELECT Id from Quarter__c where Goal_Name__c = :goal.Id];
            if(currentQuarters.isEmpty()){
                if(goal.Parent_Goal__c == null){
                    if(goal.Goal_Period__c == 'Financial Year' && goal.Target_to_be_reached__c != null){
                        Double target = goal.Target_to_be_reached__c / 4;
                        for(Integer i=1;i<5;i++){
                            Quarter__c q = new Quarter__c();
                            q.Name = 'Quarter '+i;
                            q.Goal_Name__c = goal.Id;
                            q.Target_To_be_Reached__c = target;
                            q.OwnerId = goal.OwnerId;
                            quarters.add(q);
                        }
                    }
                    else if(goal.Goal_Period__c != null && goal.Target_to_be_reached__c != null){
                        Quarter__c quarter = new Quarter__c();
                        quarter.Name = goal.Goal_Period__c;
                        quarter.Goal_Name__c = goal.Id;
                        quarter.Target_To_be_Reached__c = goal.Target_to_be_reached__c;
                        quarter.OwnerId = goal.OwnerId;
                        quarters.add(quarter);
                    }
                }
            }
        }
        if(!quarters.isEmpty())
            INSERT quarters;
    }
    
}