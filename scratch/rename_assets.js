const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../frontend/src/assets/badges');
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.png')) {
        let newName = file.toLowerCase();
        newName = newName.replace(/-/g, '_');
        
        // Handle specific typos observed
        if (newName === 'blitz_kreign.png') newName = 'blitzkrieg.png';
        if (newName === 'siren_solver.png') newName = 'sirens_solver.png';
        if (newName === 'grandmaster_rank.png') newName = 'grandmaster_ranked.png';
        if (newName === 'immortal_rank.png') newName = 'immortal_ranked.png';
        
        if (file !== newName) {
            fs.renameSync(path.join(dir, file), path.join(dir, newName));
            console.log(`Renamed: ${file} -> ${newName}`);
        }
    }
});
