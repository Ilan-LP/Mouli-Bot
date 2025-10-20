export function yearParser(yearJson) {
    const dict = {}
    for (const key in yearJson) {
      const data = yearJson[key];

      let type = "unknown";
      if (Object.keys(data).includes("project")) {
        type = "project";
      } else if (Object.keys(data).includes("module")) {
        type = "module";
      } else if (Object.keys(data).includes("details")) {
        type = "details";
      }
      const name = data[type].name;
      let counter = 0;
      for (const taskKey in data.results.skills) {
        const task = data.results.skills[taskKey];
        if (task.passed == 1) {
            counter += 1;
        }
        }
      const pourcent = Math.round((counter / Object.keys(data.results.skills).length) * 100);
      let date = data.date;
      const timestampMs = Date.parse(date);
      const timestampSec = Math.floor(timestampMs / 1000);

      dict[name] = {
        "slug": data[type].slug,
        "pourcent": pourcent,
        "date": timestampSec
      };
    }
    
    return dict
}