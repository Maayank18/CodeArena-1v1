import axios from 'axios';
const backendURL = 'http://localhost:5000/api';
const adminUsername = 'Maya';

async function check() {
    try {
        const res = await axios.post(`${backendURL}/admin/problems`, { username: adminUsername });
        const data = res.data.problems.map(p => ({ 
            title: p.title, 
            type: p.type, 
            region: p.campaignRegion, 
            node: p.campaignNodeId 
        }));
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
check();

// Version-2.0