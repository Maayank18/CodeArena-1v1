const testData = {
    username: 'admin',
    title: 'Test Campaign Problem Debug',
    slug: `test-camp-debug-${Date.now()}`,
    description: 'Testing campaign type resolution',
    difficulty: 'Easy',
    type: 'campaign',
    campaignRegion: 1,
    campaignNodeId: 'region-1-node-01',
    constraints: [],
    timeLimit: 5000,
    memoryLimit: 512,
    goldenSolution: "console.log('solution');",
    starterCode: {},
    testCases: [{input: 'test', output: 'expected', isPublic: true}]
};

console.log('Sending test data:', JSON.stringify(testData, null, 2));

fetch('http://localhost:5000/api/admin/problems/create', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err));
