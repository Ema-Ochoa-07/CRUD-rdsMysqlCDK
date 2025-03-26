#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GuestAwsRdsStack } from '../lib/guest_aws_rds-stack';

const app = new cdk.App();

new GuestAwsRdsStack(app, 'GuestAwsRdsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

app.synth();
