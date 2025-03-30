import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

interface GuestRequest {
  name: string;
  lastname: string;
  identificationType: string;
  identificationNumber: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  reservation_id?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({}),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Request body is empty' }),
    };
  }

  try {
    const requestData: GuestRequest = JSON.parse(event.body);
    
    // Validación de campos requeridos
    const requiredFields = ['name', 'lastname', 'identificationType', 'identificationNumber', 'phone', 'emergencyPhone'];
    const missingFields = requiredFields.filter(field => !requestData[field as keyof GuestRequest]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          missingFields 
        }),
      };
    }

    // Conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });

    try {
      const guest_id = uuidv4(); 

      await connection.execute(
        `INSERT INTO guest 
          (guest_id, reservation_id, name, lastname, identificationType, identificationNumber, phone, emergencyPhone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guest_id,
          requestData.reservation_id || null, 
          requestData.name,
          requestData.lastname,
          requestData.identificationType,
          requestData.identificationNumber,
          requestData.phone,
          requestData.emergencyPhone
        ]
      );

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          guest_id,
          reservation_id: requestData.reservation_id || null,
          name: requestData.name,
          lastname: requestData.lastname,
          identificationType: requestData.identificationType,
          identificationNumber: requestData.identificationNumber
        }),
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Duplicate entry')) statusCode = 409;
      if (error.message.includes('Data too long')) statusCode = 400;
    }

    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { details: error.message } 
          : {})
      }),
    };
  }
};