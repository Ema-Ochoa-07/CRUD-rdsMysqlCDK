import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class GuestAwsRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. VPC
    const vpc = ec2.Vpc.fromLookup(this, 'HuespedVpc', { vpcId: 'vpc-32a04b48' });

    // 2. Lambda consolidada
    const crudGuestLambda = new lambda.Function(this, 'CrudGuestLambda', {
      functionName: 'crudGuest',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'crudGuest.handler',
      timeout: cdk.Duration.seconds(28),
      memorySize: 512,
      environment: {
        DB_HOST: 'guest-db.cdjwgh9lczq3.us-east-1.rds.amazonaws.com',
        DB_USER: 'admin',
        DB_PASSWORD: 'Emamysql07',
        DB_NAME: 'guest_db',
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowPublicSubnet: true,
    });

    // Permisos para RDS y API Gateway
    crudGuestLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rds-db:connect'],
      resources: ['*'],
    }));

    crudGuestLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['*'],
    }));

    // 3. API Gateway
    const api = new apigateway.RestApi(this, 'GuestApi', {
      restApiName: 'Guest Service API',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST', 'GET', 'PUT', 'DELETE'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Configuración mejorada de la integración Lambda
    const integration = new apigateway.LambdaIntegration(crudGuestLambda, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          }
        }
      ],
    });

    // Rutas y métodos
    const guestsResource = api.root.addResource('guest');
    const guestIdResource = guestsResource.addResource('{guest_id}');

    // Métodos con respuestas configuradas
    guestsResource.addMethod('POST', integration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    });

    guestsResource.addMethod('GET', integration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    });

    guestIdResource.addMethod('GET', integration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    });

    guestIdResource.addMethod('PUT', integration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    });

    guestIdResource.addMethod('DELETE', integration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          }
        }
      ]
    });
  }
}