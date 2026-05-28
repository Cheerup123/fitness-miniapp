const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({
  env: 'tech-vance-d3g4nuoqse6b67920',
  secretId: 'AKID2Z29vIvtmYO00E3AFj3BO3RSBZ_YoQPiCiy9BISZKf3Sk5_UW34GqGSYtgL7zzeH',
  secretKey: 'VVz5KfAEfHBdi0hnqdmaRZCAlGzMiN3aQM10raZHX4E=',
});

async function check() {
  try {
    // 1. 检查成长计划资格
    console.log('=== 1. DescribeActivityInfo ===');
    const activityRes = await app.callCloudApi({
      service: 'tcb',
      action: 'DescribeActivityInfo',
      params: { EnvId: 'tech-vance-d3g4nuoqse6b67920' }
    });
    console.log(JSON.stringify(activityRes, null, 2));

    // 2. 检查 AI Models
    console.log('\n=== 2. DescribeAIModels ===');
    const modelsRes = await app.callCloudApi({
      service: 'tcb',
      action: 'DescribeAIModels',
      params: { EnvId: 'tech-vance-d3g4nuoqse6b67920' }
    });
    console.log(JSON.stringify(modelsRes, null, 2));

    // 3. 检查托管模型列表
    console.log('\n=== 3. DescribeManagedAIModelList ===');
    const managedRes = await app.callCloudApi({
      service: 'tcb',
      action: 'DescribeManagedAIModelList',
      params: { EnvId: 'tech-vance-d3g4nuoqse6b67920' }
    });
    console.log(JSON.stringify(managedRes, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response, null, 2));
    }
  }
}

check();
