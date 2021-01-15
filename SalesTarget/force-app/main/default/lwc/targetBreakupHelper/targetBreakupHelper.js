function calculate(type, goalPeriod, self) {

    self.quarterTargets = [];
    if (type === 'quarter') {
        return function () {
            let arr = [];
            let obj = {}
            obj[goalPeriod] = self.target;
            arr.push(obj);
            self.quarterTargets = arr;
            return arr;
        }
    }
    else if (type === "Financial Year") {
        return function () {
            let arr = [];
            arr = self.targetGoalPeriod.map((item, index) => {
                let obj = {};
                obj[item] = Math.round(self.target / 4);
                return obj;
            })
            self.quarterTargets = arr;
            return arr;
        }
    }
}

function getResultsQuarter(self) {

    let getTargets;
    if (self.goalPeriod != 'Financial Year') {
        self.targetGoalPeriod.push(self.goalPeriod);
        getTargets = calculate('quarter', self.goalPeriod, self);
    }
    else {
        self.targetGoalPeriod = JSON.parse(JSON.stringify(self.quarters));
        getTargets = calculate('Financial Year', 'Financial Year', self);
    }

    let targets = getTargets();
    Promise.resolve()
        .then(() => {
            targets.map((item, index) => {
                self.template.querySelector("[data-quarter='" + Object.keys(item)[0] + "']").value = Object.values(item)[0];
            })
        })
}

function validateTargets(userTargets, quarterTargets, totalTarget) {
    let usertargetsSum;
    let quarterTargetsSum;
    let errors = [];

    //console.log(userTargets);
    //console.log(quarterTargets);

    usertargetsSum = userTargets.reduce((acc, item) => {
        return acc + item;
    });
    quarterTargetsSum = quarterTargets.reduce((acc, item) => {
        return acc + item;
    });


    if (quarterTargetsSum - totalTarget > 15 || quarterTargetsSum - totalTarget < -15) {
        errors.push('Quarter Sum error');
    }
    if (usertargetsSum - totalTarget > 15 || usertargetsSum - totalTarget < -15) {
        errors.push('User Sum error');
    }
    return errors;
}


function setSum(self) { /* bugs in this method and adjustment need to rectify it*/
    let totalSum = 0;
    self.userTargets.map(item => {
        totalSum = totalSum + item.target;
    });
    if (self.template.querySelector('[data-input="sum"]') != null || self.template.querySelector('[data-input="sum"]') != undefined) {
        if (self.target - totalSum > 15 || self.target - totalSum < -15) {
            self.template.querySelector('[data-input="sum"]').value = self.target - totalSum;
            self.template.querySelector('[data-input="sum"]').style.color = 'red';
        }
        else {
            self.template.querySelector('[data-input="sum"]').value = 0;
            self.template.querySelector('[data-input="sum"]').style.color = 'green';
        }
    }


}

function fillData(self) {
    self.userTargets = [];
    let userTarget = 0;
    userTarget = Math.round(self.target / self.users.length); // make a call to the server to fill in the data


    self.userTargets = self.users.map((item, index) => {
        let obj = {};
        obj.userId = item.Id;
        obj.target = userTarget;

        if (!self.isTargetsConfirmed)
            self.template.querySelector('[data-userid="' + item.Id + '"]').value = userTarget;
        else {
            console.log(self.presetTargets);
            console.log(item.Id);
            obj.target = self.presetTargets[item.Id];
            self.template.querySelector('[data-userid="' + item.Id + '"]').value = obj.target;
        }


        return obj;
    })

    if (self.goalPeriod != null || self.goalPeriod != undefined) {
        getResultsQuarter(self);
    }
}

function disableFields(isParent, isConfirmed, self) {
    if (isConfirmed) {
        self.template.querySelector('[data-element="target"]').disabled = true;
        self.template.querySelector('lightning-combobox').disabled = true;
        self.template.querySelectorAll('lightning-input').forEach(element => {
            element.disabled = true;
        });
    }
    else if (!isParent && !isConfirmed) {
        self.template.querySelector('[data-element="target"]').disabled = true;
        self.template.querySelector('lightning-combobox').disabled = true;
    }
}



export { calculate, getResultsQuarter, validateTargets, setSum, fillData, disableFields };