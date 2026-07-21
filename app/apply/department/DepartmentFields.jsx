'use client';

import { useState } from 'react';

const STATION_DEPARTMENTS = ['fire', 'ems'];

export default function DepartmentFields() {
  const [department, setDepartment] = useState('');
  const needsStation = STATION_DEPARTMENTS.includes(department);

  return (
    <>
      <div className="field">
        <label htmlFor="department">Department</label>
        <select
          id="department"
          name="department"
          required
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="" disabled>Choose a department&hellip;</option>
          <option value="police">Police Department</option>
          <option value="sheriff">Sheriff&rsquo;s Department</option>
          <option value="fire">Fire Department</option>
          <option value="ems">EMS</option>
          <option value="dot">Department of Transportation</option>
        </select>
      </div>

      {needsStation && (
        <div className="field">
          <label htmlFor="station">Station</label>
          <select id="station" name="station" required defaultValue="">
            <option value="" disabled>Choose a station&hellip;</option>
            <option value="river_city">River City — Station 1</option>
            <option value="liberty_county">Liberty County — Station 18</option>
          </select>
        </div>
      )}
    </>
  );
}
