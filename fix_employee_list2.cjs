const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');
content = content.replace(/د';\n    else if \(score >= 60\) level = 'مقبول';\n    else level = 'يحتاج تحسين';\n\n    setRatingForm\(prev => \({\n      \.\.\.prev,\n      score,\n      level\n    }\)\);\n  };/, '');
fs.writeFileSync('src/pages/EmployeeList.tsx', content);
