export function mouliParser(mouliJson) {
  const dict = {}
  dict.name = mouliJson.instance.projectName;
  dict.module = mouliJson.instance.moduleCode;
  dict.slug = mouliJson.instance.projectSlug;
  dict.code = mouliJson.instance.code;
  dict.city = mouliJson.instance.city;
  dict.year = mouliJson.instance.year;

  let date = mouliJson.date;
  const timestampMs = Date.parse(date);
  const timestampSec = Math.floor(timestampMs / 1000);
  dict.date = timestampSec;

  const taskDict = {}
  for (const taskKey in mouliJson.skills) {
    const task = mouliJson.skills[taskKey].FullSkillReport;
    taskDict[task.name] = task.tests[0].passed;
  }
  dict.task = taskDict;

  let counter = 0;
      for (const taskKey in taskDict) {
        const task = taskDict[taskKey];
        if (task) {
            counter += 1;
        }
        }
  dict.pourcent = (counter / Object.keys(taskDict).length) * 100;
  dict.git = mouliJson.gitCommit;
  dict.comment = mouliJson.externalItems[0].comment;
  return dict
}