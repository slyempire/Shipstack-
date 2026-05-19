import fs from 'fs';
const content = fs.readFileSync('/views/admin/TripManagement.tsx', 'utf8');
const lines = content.split('\n');
// Line 755 and 756 are the messy ones (0-indexed 754 and 755)
// But let's be sure by content
const newLines = lines.filter((line, idx) => {
  if (idx === 754 || idx === 755) {
     if (line.includes('setSelectedTrip(null)') && line.includes('p-3')) return false;
     if (line.trim() === '</div>' && lines[idx-1].includes('setSelectedTrip(null)')) return false;
  }
  return true;
});
fs.writeFileSync('/views/admin/TripManagement.tsx', newLines.join('\n'));
