public class DE_SalesTargetContoller {
    @AuraEnabled(cacheable=true)
    public static List<User> getUsers(String recordId){
        String owner = [Select Id,OwnerId from Goal__c where Id =: recordId].OwnerId;
        return [select Id,Name,UserRole.Name,Title from User where ManagerId =: owner];
    }
    
    @AuraEnabled
    public static Integer updateParentGoals(List<Goal__c> insertedGoals){
        List<User> users = new List<User>();
        List<Id> owners = new List<Id>();
        List<Goal__c> goalsWithManagers = new List<Goal__c>();
        Map<Id, Id> goalMap = new Map<Id, Id>();
        List<Goal__c> updateGoals = new List<Goal__c>();
        
        
        for(Goal__c g: insertedGoals){
            owners.add(g.ownerId);
        }
        
        users = [Select Id, ManagerId from User where Id IN :owners];
        
        for(Integer i=0;i<users.size();i++){
            for(Integer j=0;j<insertedGoals.size();j++){
                if(users[i].Id == insertedGoals[j].OwnerId){
                    goalMap.put(insertedGoals[j].Id,users[i].ManagerId);
                    //system.debug(insertedGoals[i].Id+'goal =====> manager'+users[i].ManagerId);
                }
                
            }
        }
        
        for(Goal__c goal: insertedGoals){
            Id manager = goalMap.get(goal.Id);
            for(Goal__c g: insertedGoals){
                if(g.OwnerId == manager){
                    goal.Parent_Goal__c = g.Id;
                    updateGoals.add(goal);
                }
            }
        }
        
        UPDATE updateGoals;
        return 1;
    }
    
    @AuraEnabled
    public static List<Goal__c> insertChildGoals(String parentGoalId, List<String> users, List<Double> targets){
        List<User> userRecords = [Select Name,Id from User where Id IN :users]; 
        List<Goal__c> resultGoalIds = new List<Goal__c>();
        
        Goal__c parentGoal = [SELECT Id,Name, Goal_Period__c, Target_to_be_reached__c, Financial_Year__c,Target_Type__c, RecordTypeId FROM Goal__c where Id=: parentGoalId];
        List<Goal__c> goals = new List<Goal__c>();
        
        
        
        String prefixName = 'Target';
        
        for(Integer i=0;i< users.size();i++){
            Goal__c goal = new Goal__c();
            goal.Name = prefixName + ' - ' +userRecords[i].Name;
            goal.Goal_Period__c = parentGoal.Goal_Period__c;
            goal.Parent_Goal__c = parentGoalId;
            goal.Target_to_be_reached__c = targets[i];
            goal.Financial_Year__c = parentGoal.Financial_Year__c;
            goal.Target_Type__c = parentGoal.Target_Type__c;
            goal.OwnerId = userRecords[i].Id;
            goal.RecordTypeId = parentGoal.RecordTypeId;
            goals.add(goal);
        }
        INSERT goals;
        resultGoalIds.addAll(goals);
        
        return resultGoalIds;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Goal__c getOrgLevelGoal(String recordId){
        Goal__c childGoal = [Select Id,Parent_Goal__c,Target_To_be_Reached__c,Goal_Period__c, Targets_Confirmed__c from Goal__c where Id=: recordId];
        return childGoal;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpps(String recordId){
        Goal__c goal = [SELECT Id,OwnerId,Start_Date__c,End_Date__c from Goal__c where Id=: recordId];
        List<User> users = [SELECT Id,Name,ManagerId from User where Id = :goal.OwnerId];
        for(Integer i=0;i<users.size();i++){
            List<User> reportees = [Select Id,Name,ManagerId from User where ManagerId =: users[i].Id];
            if(!reportees.isEmpty())
                users.addAll(reportees);
        }
        
        return [SELECT Id,Name,CloseDate,StageName,Amount,Account.Name from Opportunity where OwnerId IN :users and StageName !='Closed Won' and StageName !='Closed Lost' and CloseDate > :goal.Start_Date__c and CloseDate < :goal.End_Date__c];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getClosedOpps(String recordId){
        Goal__c goal = [SELECT Id,OwnerId,Start_Date__c,End_Date__c from Goal__c where Id=: recordId];
        List<User> users = [SELECT Id,Name,ManagerId from User where Id = :goal.OwnerId];
        for(Integer i=0;i<users.size();i++){
            List<User> reportees = [Select Id,Name,ManagerId from User where ManagerId =: users[i].Id];
            if(!reportees.isEmpty())
                users.addAll(reportees);
        }
        
        return [SELECT Id,Name,CloseDate,StageName,Amount,Account.Name from Opportunity where OwnerId IN :users and StageName ='Closed Won' and CloseDate > :goal.Start_Date__c and CloseDate < :goal.End_Date__c];
        
    }
    
    @AuraEnabled(cacheable=true)
    public static Goal__c getGoal(String recordId){
        return [SELECT Id, Target_Reached__c,In_Progress__c,Target_to_be_reached__c,Percentage_Reached__c from Goal__c where Id= :recordId];
    }
    
    
    @AuraEnabled
    public static Integer confirmTargets(String recordId){
        Goal__c goal = [SELECT Id,Targets_Confirmed__c from Goal__c where Id= :recordId];
        goal.Targets_Confirmed__c = true;
        update goal;
        return 1;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Goal__c> getChildGoals(String recordId){
        return [SELECT Id,OwnerId,Target_to_be_reached__c from Goal__c where Parent_Goal__c =: recordId AND Type__c = null];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Goal__c> getAreaChildGoals(String recordId){
        return [SELECT Id,Name,OwnerId,Target_to_be_reached__c from Goal__c where Parent_Goal__c =: recordId AND Type__c = 'Area'];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Goal__c> getProductFamilyChildGoals(String recordId){
        return [SELECT Id,Name,OwnerId,Target_to_be_reached__c from Goal__c where Parent_Goal__c =: recordId AND Type__c = 'Product Family'];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getProductFamilies(){
        List<Product2> products = [SELECT Family from Product2];
        List<String> productFamilies = new List<String>();
        for(Product2 product: products){
            productFamilies.add(product.Family);
        }
        Set<String> familiesSet = new Set<String>(productFamilies);
        return new List<String>(familiesSet);
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getAreas(){
        List<String> areas = new List<String>();
        for(Area__c area: [SELECT Name from Area__c]){
            areas.add(area.Name); 
        }
        return areas;
    }
    
}