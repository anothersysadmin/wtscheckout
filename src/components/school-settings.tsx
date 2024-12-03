import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { updateSchoolSettings } from '../lib/api';
import { getSchools } from '../lib/utils';

export function SchoolSettings() {
  const schools = getSchools();
  const [settings, setSettings] = useState(
    schools.map(school => ({
      id: school.id,
      name: school.name,
      allowNewDevices: false,
    }))
  );
  // Rest of the component remains unchanged
}
