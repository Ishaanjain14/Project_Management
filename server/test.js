import axios from 'axios';
const test = async () => {
    try {
        const res = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'alex@projecthub.com',
            password: 'password123'
        });
        console.log('Login successful:', res.data.user.name);
        
        const wsRes = await axios.get('http://localhost:5001/api/workspaces', {
            headers: { Authorization: `Bearer ${res.data.token}` }
        });
        console.log('Workspaces fetched:', wsRes.data.length);
        
        console.log('Backend is fully operational.');
    } catch (error) {
        console.error('Test failed:', error.message, error.response?.data);
    }
}
test();
