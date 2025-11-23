async function testGenerate() {
    try {
        console.log('Sending request...');
        const res = await fetch('http://localhost:3001/api/projects/rad-project-default/use-cases/part1-account-intel/tests/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spec: 'Test Spec Content',
                type: 'unit'
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testGenerate();
