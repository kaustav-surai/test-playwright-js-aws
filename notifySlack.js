import { argv, version } from 'yargs';
import { SNS } from 'aws-sdk';
const summary = require('allure-report/widgets/summary.json');

async function notifySlack() {
    const { name, success, report, buildId, startTime } = argv;

    const sns = new SNS({
        region: 'us-east-2',
    });

    const [projectName, id] = buildId.split(':');

    const parsedStartTime = new Date(startTime).toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
    });

    const description = [
        `<${report}|Report>`,
        `<https://us-east-2.console.aws.amazon.com/codesuite/codebuild/390403859997/projects/${projectName}/build/${projectName}%3A${id}?region=us-east-2|CodeBuild>`,
        `Start time: ${parsedStartTime}`
    ].join(' | ');

    console.info('Allure reports', report);

    sns.publish({
        Message: JSON.stringify({
            version: '1.0',
            source: 'custom',
            content: {
                title: `QA Run: \`${name}\` ${success.toString() === '1'
                        ? 'was successful ✅'
                        : `failed ❌`
                    }`,
                description,
            },
        }),
        TopicArn:
            'arn:aws:sns:us-east-2:390403859997:playwright-slack-notification'
    }).promise();
}

notifySlack();
