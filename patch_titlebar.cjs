const fs = require('fs');
let file = fs.readFileSync('src/components/TitleBar.tsx', 'utf8');

file = file.replace(/import \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';");
file = file.replace(/window\.require/g, "(window as any).require");

fs.writeFileSync('src/components/TitleBar.tsx', file);

let appFile = fs.readFileSync('src/App.tsx', 'utf8');
appFile = appFile.replace(/window\.require/g, "(window as any).require");
fs.writeFileSync('src/App.tsx', appFile);
