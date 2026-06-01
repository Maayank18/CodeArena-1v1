import axios from 'axios';
const backendURL = 'http://localhost:5000/api';

async function check() {
    try {
        const res = await axios.get(`${backendURL}/campaign/map`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
check();

// Version-2.0