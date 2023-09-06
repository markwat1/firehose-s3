# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## requirements for password generator
```
npm install mersenne-twister
npm install --save @types/mersenne-twister
```
## install aws-kinesis-agent
```
sudo yum install -y aws-kinesis-agent
```
## Setup User   /etc/init.d/aws-kinesis-agent
```
sed -i 's/aws-kinesis-agent-user/root/' /etc/init.d/aws-kinesis-agent
```
## Store EC2 Logs into S3 via Kinesis Firehose datastream
## setup /etc/aws-kinesis-agent/agent.json

```
{
  "cloudwatch.emitMetrics" : false,
  "firehose.endpoint": "https://firehose.ap-northeast-1.amazonaws.com",
  "flows": [
    {
      "filePattern": "/var/log/messages",
      "deliveryStream": "__LOG_STREAM_NAME__"
    }
  ]
}
```

## start enable
```
service aws-kinesis-agent start
chkconfig aws-kinesis-agent on
```
