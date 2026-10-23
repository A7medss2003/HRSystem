const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const newLogic = `
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldTargetSection, setNewFieldTargetSection] = useState('');
  const [newFieldDef, setNewFieldDef] = useState({ label: '', width: '1' as '1'|'2'|'3' });

  const handleOpenFieldModal = (section: string) => {
    setNewFieldTargetSection(section);
    setNewFieldDef({ label: '', width: '1' });
    setShowFieldModal(true);
  };

  const handleSaveGlobalField = () => {
    if (!newFieldDef.label) return;
    const newField = {
      id: 'gfield-' + Date.now(),
      section: newFieldTargetSection,
      label: newFieldDef.label,
      width: newFieldDef.width
    };
    setGlobalCustomFields([...(globalCustomFields || []), newField]);
    setShowFieldModal(false);
  };

  const handleDeleteGlobalField = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحقل الإضافي لجميع الموظفين؟')) {
      setGlobalCustomFields((globalCustomFields || []).filter(f => f.id !== id));
    }
  };

  const handleTogglePermission = (permId: string) => {
    if (readOnly || !isAdmin) return;
    setFormData(prev => {
      const current = prev.customPermissions || [];
      const updated = current.includes(permId) 
        ? current.filter(p => p !== permId) 
        : [...current, permId];
      return { ...prev, customPermissions: updated };
    });
  };
`;

file = file.replace(
  /const handleUpdateGlobalFieldValue =/,
  newLogic + "\n  const handleUpdateGlobalFieldValue ="
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
