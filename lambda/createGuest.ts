import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
interface Guest {
  room_id: string;
  customer_id: string;
  name: string;
  lastname: string;
  identification: string;
  email?: string;
  phone?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Iniciando Lambda...');
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Cuerpo de solicitud vacío' }),
    };
  }


  try {
    // Conexión directa (modo desarrollo)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER, // 'admin'
      password: process.env.DB_PASSWORD, // 'Emamysql07'
      database: process.env.DB_NAME,
      connectTimeout: 10000 // 10 segundos timeout
    });

    try {
      const guest: Guest = JSON.parse(event.body);
      
      const guest_id = uuidv4();

      await connection.execute(
        `INSERT INTO guest 
         (guest_id, customer_id, room_id, name, lastname, identification, email, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guest_id,
          guest.customer_id,
          guest.room_id,
          guest.name,
          guest.lastname,
          guest.identification,
          guest.email || null,
          guest.phone || null,
        ]
      );


      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          success: true,
          message: 'Huésped registrado exitosamente'
        }),
      };
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
    };
  }
};
