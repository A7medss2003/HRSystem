const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the grid for 3 cards to 4 cards
file = file.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">/,
  '<div className="grid grid-cols-1 md:grid-cols-4 gap-6">'
);

// Add the 4th card (e.g. Leave Requests pending)
file = file.replace(
  /<StatCard title="الوظائف الشاغرة" value="3" icon=\{Briefcase\} borderColorClass="border-blue-600" iconColorClass="text-blue-600" \/>/,
  `<StatCard title="الوظائف الشاغرة" value="3" icon={Briefcase} borderColorClass="border-blue-600" iconColorClass="text-blue-600" />
        <StatCard title="طلبات الإجازة" value={leaves.filter(l => l.status === 'Pending').length.toString()} icon={FileText} borderColorClass="border-orange-500" iconColorClass="text-orange-500" />`
);

fs.writeFileSync('src/pages/Dashboard.tsx', file);
