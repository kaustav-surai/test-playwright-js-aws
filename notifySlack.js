import yargs from 'yargs/yargs';
import AWS from 'aws-sdk';

async function notifySlack() {
    const argv = await yargs(process.argv.slice(2))
         .option('name', { type: 'string', description: 'Name of the QA run', demandOption: true })
         .option('success', { type: 'string', description: 'Result of the QA run (e.g., "true", "false", "1", "0")', demandOption: true })
         .option('report', { type: 'string', description: 'URL to the Allure report', demandOption: true })
         .option('buildId', { type: 'string', description: 'CodeBuild build ID (projectName:id)', demandOption: true })
         .option('startTime', { type: 'string', description: 'Start time of the QA run (ISO format or format parsable by Date)', demandOption: true })
         .option('region', { type: 'string', default: 'us-east-2', description: 'AWS region for SNS' })
         .argv;

    const { name, success, report, buildId, startTime, region } = argv;
    const sns = new AWS.SNS({
        region: region,
    });

    const [projectName, id] = buildId.split(':');

    const parsedStartTime = new Date(startTime).toLocaleTimeString('en-GB',{
        timeZone:'Europe/London',
    });

    const description = [
        `<${report}|Report>`,
        `<https://us-east-2.console.aws.amazon.com/codesuite/codebuild/390403859997/projects/${projectName}/build/${projectName}%3A${id}?region=${region}|CodeBuild>`,
        `Start time: ${parsedStartTime}`
    ].join(' | ');

    try {
        const successBool = success.toLowerCase() === 'true' || success === '1';

        await sns.publish({
            Message: JSON.stringify({
                version: '1.0',
                source: 'custom',
                content: {
                    title: `QA Run: \`${name}\` ${successBool
                            ? 'was successful ✅'
                            : `failed ❌`
                        }`,
                    description,
                },
            }),
            TopicArn:
                'arn:aws:sns:us-east-2:390403859997:playwright-slack-notification'
        }).promise();
        console.log('Slack notification sent successfully!');
    } catch (error) {
        console.error('Error sending Slack notification:', error);
    }
}

notifySlack();