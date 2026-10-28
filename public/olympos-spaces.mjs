import {spaces} from './olympos-structure.mjs';
const root=document.getElementById('drive-spaces');
for(const s of spaces){const a=document.createElement('a'),b=document.createElement('strong'),small=document.createElement('small');a.href=s.driveUrl;b.textContent=s.name;small.textContent='Dossier de référence · Google Drive';a.append(b,small);root.append(a)}
