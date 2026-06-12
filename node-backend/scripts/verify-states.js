
async function testValidation() {
    const baseUrl = 'http://localhost:3000/api/public/validate-state';

    const scenarios = [
        { name: 'Punjab (Active)', state: 'Punjab', expectedStatus: 'active' },
        { name: 'Unknown State', state: 'Alaska', expectedStatus: 'not_found' },
        { name: 'Karnataka (Inactive)', state: 'Karnataka', expectedStatus: 'inactive' }
    ];

    for (const scenario of scenarios) {
        try {
            console.log(`Testing ${scenario.name}...`);
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: scenario.state })
            });

            const data = await response.json();
            console.log(`Result: isValid=${data.isValid}, status=${data.status}, message="${data.message}"`);

            if (data.status === scenario.expectedStatus) {
                console.log('PASS');
            } else {
                console.log('FAIL - Expected ' + scenario.expectedStatus + ' got ' + data.status);
            }
        } catch (err) {
            console.log('Request Failed:', err.message);
        }
        console.log('---');
    }
}

testValidation();
