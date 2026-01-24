const axios = require('axios');

// Test data for pendulum experiment
const testData = {
  experiment_type: 'pendulum',
  data_points: [
    { time: 0.0, value: 10.5, raw_data: { ax: 0.1, ay: 0.0, az: 1.0 } },
    { time: 0.1, value: 8.2, raw_data: { ax: 0.08, ay: 0.0, az: 1.0 } },
    { time: 0.2, value: 5.1, raw_data: { ax: 0.05, ay: 0.0, az: 1.0 } },
    { time: 0.3, value: 1.8, raw_data: { ax: 0.02, ay: 0.0, az: 1.0 } },
    { time: 0.4, value: -2.1, raw_data: { ax: -0.02, ay: 0.0, az: 1.0 } },
    { time: 0.5, value: -5.8, raw_data: { ax: -0.05, ay: 0.0, az: 1.0 } },
    { time: 0.6, value: -8.9, raw_data: { ax: -0.08, ay: 0.0, az: 1.0 } },
    { time: 0.7, value: -10.2, raw_data: { ax: -0.1, ay: 0.0, az: 1.0 } },
    { time: 0.8, value: -9.1, raw_data: { ax: -0.09, ay: 0.0, az: 1.0 } },
    { time: 0.9, value: -6.3, raw_data: { ax: -0.06, ay: 0.0, az: 1.0 } },
    { time: 1.0, value: -2.5, raw_data: { ax: -0.02, ay: 0.0, az: 1.0 } },
    { time: 1.1, value: 1.8, raw_data: { ax: 0.02, ay: 0.0, az: 1.0 } },
    { time: 1.2, value: 5.9, raw_data: { ax: 0.06, ay: 0.0, az: 1.0 } },
    { time: 1.3, value: 9.2, raw_data: { ax: 0.09, ay: 0.0, az: 1.0 } },
    { time: 1.4, value: 10.8, raw_data: { ax: 0.1, ay: 0.0, az: 1.0 } }
  ],
  device_info: {
    device_id: 'esp32_test',
    device_ip: '192.168.1.4'
  }
};

async function testAIAnalysis() {
  try {
    console.log('🧪 Testing AI Analysis Endpoint...');
    console.log(`📊 Sending ${testData.data_points.length} data points for ${testData.experiment_type} analysis`);
    
    const response = await axios.post('http://localhost:3002/api/ai/analyze-experiment', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ AI Analysis Response:');
    console.log('📈 Data Summary:', response.data.data_summary);
    console.log('📊 Analysis:', response.data.analysis);
    console.log('🧠 Summary:', response.data.summary);
    console.log('🔬 Physics Principles:', response.data.physics_principles);
    console.log('💡 Recommendations:', response.data.recommendations);
    
    if (response.data.error_analysis) {
      console.log('🔍 Error Analysis:', response.data.error_analysis);
    }
    
    console.log('\n✅ AI Analysis endpoint is working correctly!');
    
  } catch (error) {
    console.error('❌ AI Analysis Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test free fall analysis too
async function testFreefallAnalysis() {
  const freefallData = {
    experiment_type: 'freefall',
    data_points: [
      { time: 0.0, value: 9.85, raw_data: { ax: 0.02, ay: 0.01, az: 0.05 } },
      { time: 0.1, value: 9.78, raw_data: { ax: 0.01, ay: 0.02, az: 0.03 } },
      { time: 0.2, value: 9.82, raw_data: { ax: 0.03, ay: 0.01, az: 0.04 } },
      { time: 0.3, value: 9.79, raw_data: { ax: 0.02, ay: 0.03, az: 0.02 } },
      { time: 0.4, value: 9.84, raw_data: { ax: 0.01, ay: 0.02, az: 0.06 } },
      { time: 0.5, value: 9.77, raw_data: { ax: 0.04, ay: 0.01, az: 0.03 } }
    ],
    device_info: {
      device_id: 'esp32_test',
      device_ip: '192.168.1.4'
    }
  };
  
  try {
    console.log('\n🧪 Testing Free Fall Analysis...');
    
    const response = await axios.post('http://localhost:3002/api/ai/analyze-experiment', freefallData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Free Fall Analysis Response:');
    console.log('📊 Analysis:', response.data.analysis);
    console.log('🧠 Summary:', response.data.summary);
    
    console.log('\n✅ Free fall analysis endpoint is working correctly!');
    
  } catch (error) {
    console.error('❌ Free Fall Analysis Test Failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testAIAnalysis();
  await testFreefallAnalysis();
  process.exit(0);
}

runTests();