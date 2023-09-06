#! /bin/bash
if $(uname -p)x eq X86_64 ; then
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
else
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_arm64/amazon-ssm-agent.rpm
fi
systemctl restart amazon-ssm-agent
yum install –y aws-kinesis-agent
sed -i 's/aws-kinesis-agent-user/root/' /etc/init.d/aws-kinesis-agent
echo '{' > /etc/aws-kinesis/agent.json 
echo '  "cloudwatch.emitMetrics" : false,' >> /etc/aws-kinesis/agent.json
echo '  "firehose.endpoint": "https://firehose.ap-northeast-1.amazonaws.com",' >> /etc/aws-kinesis/agent.json 
echo '  "flows": [' >> /etc/aws-kinesis/agent.json 
echo '    {' >> /etc/aws-kinesis/agent.json 
echo '      "filePattern": "/var/log/messages",' >> /etc/aws-kinesis/agent.json 
echo '      "deliveryStream": "__LOG_STREAM_NAME__"' >> /etc/aws-kinesis/agent.json 
echo '    }' >> /etc/aws-kinesis/agent.json 
echo '  ]' >> /etc/aws-kinesis/agent.json 
echo '}' >> /etc/aws-kinesis/agent.json 
service aws-kinesis-agent start
chkconfig aws-kinesis-agent on
