const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(/import \{ Shield, useState \} from 'react';/, "import { useState } from 'react';");
file = file.replace(/import \{ ArrowRight, /, "import { ArrowRight, Shield, ");

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
