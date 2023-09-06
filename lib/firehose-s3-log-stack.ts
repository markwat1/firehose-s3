import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { aws_kinesisfirehose as firehose } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

import { Ec2Instance} from './ec2';
import { Eic } from './eic';
import { Vpc } from './vpc';
import * as fs from 'fs';
import * as pg from './passwordGenerator';
import { Policy, PolicyDocument } from 'aws-cdk-lib/aws-iam';

export class FirehoseS3LogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Log Store bucket
    const deliveryStreamName = "logStream";
    const logBucket = new s3.Bucket(this,"firehoseLogBucket",{
      removalPolicy:cdk.RemovalPolicy.DESTROY,
    });
    // log store policy
    const s3PolicyStatement = new iam.PolicyStatement({
      actions:[
        's3:PutObject',
        's3:GetObject',
        's3:GetObjectAttributes',
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
      ],
      resources:[
        logBucket.bucketArn,  
        logBucket.bucketArn + '/*',
      ],
      effect:iam.Effect.ALLOW,
    });
    const s3Role = new iam.Role(this,'s3-role',{
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies:{"s3Policy":new iam.PolicyDocument({
        statements:[s3PolicyStatement]
      })},
    });
    const fhstream = new firehose.CfnDeliveryStream(this,"firehose-stream",{
      deliveryStreamType:"DirectPut",
      deliveryStreamName:deliveryStreamName,
      s3DestinationConfiguration:{
        bucketArn: logBucket.bucketArn,
        roleArn: s3Role.roleArn,
        bufferingHints: {
          intervalInSeconds: 600,
          sizeInMBs: 10,
        },
        cloudWatchLoggingOptions: {
          enabled: false,
          logGroupName: 'kinesisLogs',
          logStreamName: 'firehose',
        },
        compressionFormat: 'GZIP',
        errorOutputPrefix: 'error',
        prefix: 'ec2-logs',
      },
    });
    
    // Virtual Private Cloud(VPC)
    const availabilityZones = ['ap-northeast-1c'];
    const vpc = new Vpc(this,'firehose-test-ec2',{
      availabilityZones: availabilityZones,
    });
    // Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      securityGroupName:'ec2-sg',
    });
    const eicSecurityGroup = new ec2.SecurityGroup(this,'eic-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: false,
      securityGroupName:'eic-sg'
    });
    ec2SecurityGroup.addIngressRule(eicSecurityGroup,ec2.Port.tcp(22));
    eicSecurityGroup.addEgressRule(ec2SecurityGroup,ec2.Port.tcp(22));
    ec2SecurityGroup.addIngressRule(ec2SecurityGroup,ec2.Port.allTcp());
    // EC2 Instances
    let instances:Ec2Instance[] = [];
    for(const az of availabilityZones){
      instances.push( new Ec2Instance(this,'ec2-' + az,{
        vpc: vpc.getVpc(),
        name:'ec2-' + az,
        availabilityZone: az,
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        instanceClass: ec2.InstanceClass.T4G,
        instanceSize: ec2.InstanceSize.NANO,
        ec2SecurityGroup: ec2SecurityGroup,
      }));
    }
    const firehosePutRecord = new iam.PolicyStatement({
      actions:[
        "firehose:DeleteDeliveryStream",
        "firehose:PutRecord",
        "firehose:PutRecordBatch",
        "firehose:UpdateDestination"
      ],
      resources:[fhstream.attrArn],
      effect:iam.Effect.ALLOW,
    });
    for(const instance of instances){
      instance.getInstance().addToRolePolicy(firehosePutRecord);
    }
    const userDataSource = fs.readFileSync('./lib/ud.sh','utf8');
    const pwg = new pg.PasswordGenerator();
    const defaultEscapeChars = '\\`"$';
    const dbPassword = pwg.generate({length:24});
    const replaceValues = {
      __LOG_STREAM_NAME__: deliveryStreamName
    };
    const userDataScript = pg.replaceStrings(userDataSource,replaceValues);
    for(const instance of instances){
      instance.getInstance().addUserData(userDataScript);
    }
    // EIC
    new Eic(this,'eic',{
      securityGroupId:eicSecurityGroup.securityGroupId,
      subnetId:vpc.getVpc().selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds[0],
    });
  }
}
