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

    // Configuración común para todas las Lambdas
    const lambdaCommonProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(28),
      memorySize: 512,
      environment: {
        DB_HOST: 'guest-db.cdjwgh9lczq3.us-east-1.rds.amazonaws.com',
        DB_USER: 'admin',
        DB_PASSWORD: 'Emamysql07',
        DB_NAME: 'guest_db'
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowPublicSubnet: true,
    };

    // 2. Lambda Functions
    const createGuestLambda = new lambda.Function(this, 'CreateGuestLambda', {
      ...lambdaCommonProps,
      handler: 'createGuest.handler',
    });

    const getGuestsLambda = new lambda.Function(this, 'GetGuestsLambda', {
      ...lambdaCommonProps,
      handler: 'getGuests.handler',
    });

    const getOneGuestLambda = new lambda.Function(this, 'GetOneGuestLambda', {
      ...lambdaCommonProps,
      handler: 'getOneGuest.handler',
    });

    const updateGuestLambda = new lambda.Function(this, 'UpdateGuestLambda', {
      ...lambdaCommonProps,
      handler: 'updateGuest.handler',
    });

    const deleteGuestLambda = new lambda.Function(this, 'DeleteGuestLambda', {
      ...lambdaCommonProps,
      handler: 'deleteGuest.handler',
    });

    // 3. Permisos adicionales para todas las Lambdas
    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['rds-db:connect'],
      resources: ['*'],
    });

    [createGuestLambda, getGuestsLambda, getOneGuestLambda, updateGuestLambda, deleteGuestLambda].forEach(lambda => {
      lambda.addToRolePolicy(lambdaPolicy);
    });

    // 4. API Gateway con CORS habilitado automáticamente
    const api = new apigateway.RestApi(this, 'GuestApi', {
      restApiName: 'guest-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Integrar Lambda con API Gateway
    const guestsResource = api.root.addResource('guest');
    guestsResource.addMethod('POST', new apigateway.LambdaIntegration(createGuestLambda));
    guestsResource.addMethod('GET', new apigateway.LambdaIntegration(getGuestsLambda));

    const guestIdResource = guestsResource.addResource('{guest_id}');
    guestIdResource.addMethod('GET', new apigateway.LambdaIntegration(getOneGuestLambda));
    guestIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateGuestLambda));
    guestIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteGuestLambda));
  }
}
