import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class GuestAwsRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Configuración de VPC
    const vpc = ec2.Vpc.fromLookup(this, 'HuespedVpc', { vpcId: 'vpc-32a04b48' });

    // 2. Lambda Function
    const createGuestLambda = new lambda.Function(this, 'CreateGuestLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'createGuest.handler',
      timeout: cdk.Duration.seconds(28),
      memorySize: 512,
      environment: {
        // Credenciales manuales (modo desarrollo)
        DB_HOST: 'guest-db.cdjwgh9lczq3.us-east-1.rds.amazonaws.com',
        DB_USER: 'admin',
        DB_PASSWORD: 'Emamysql07',
        DB_NAME: 'guest_db'
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowPublicSubnet: true,
    });

    // 4. API Gateway
    const api = new apigateway.RestApi(this, 'GuestApi', {
      restApiName: 'guest-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    api.root.addResource('guest').addMethod(
      'POST',
      new apigateway.LambdaIntegration(createGuestLambda, {
        timeout: cdk.Duration.seconds(28)
      })
    );
  }
}
