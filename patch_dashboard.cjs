const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the StatCard rendering
file = file.replace(
  /<StatCard title="إجمالي الموظفين" value=\{employees.length.toString\(\)\} icon=\{Users\} color="bg-blue-500" \/>/,
  '<StatCard title="إجمالي الموظفين" value={employees.length.toString()} icon={Users} borderColorClass="border-blue-800" iconColorClass="text-blue-800" />'
);

file = file.replace(
  /<StatCard title="الموظفين النشطين" value=\{activeEmployees.toString\(\)\} icon=\{Users\} color="bg-emerald-500" \/>/,
  '<StatCard title="الموظفين النشطين" value={activeEmployees.toString()} icon={Users} borderColorClass="border-emerald-600" iconColorClass="text-emerald-600" />'
);

file = file.replace(
  /<StatCard title="الوظائف الشاغرة" value="3" icon=\{Briefcase\} color="bg-amber-500" \/>/,
  '<StatCard title="الوظائف الشاغرة" value="3" icon={Briefcase} borderColorClass="border-blue-600" iconColorClass="text-blue-600" />'
);


// Replace StatCard component definition
file = file.replace(
  /const StatCard = \(\{ title, value, icon: Icon, color \}: any\) => \([\s\S]*?\}\);/m,
  `const StatCard = ({ title, value, icon: Icon, borderColorClass, iconColorClass }: any) => (
  <div className={\`bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-r-[6px] \${borderColorClass} flex items-center justify-between\`}>
    <div className="text-right">
      <p className="text-sm text-slate-500 font-medium mb-2">{title}</p>
      <p className="text-4xl font-bold text-slate-800">{value}</p>
    </div>
    <div className={\`\${iconColorClass}\`}>
      <Icon size={48} strokeWidth={1.5} />
    </div>
  </div>
);`
);

fs.writeFileSync('src/pages/Dashboard.tsx', file);
