import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';

interface Guest {
  guest_id: string;
  customer_id: string | null;
  room_id: string | null;
  name: string;
  lastname: string;
  identificationType: string;
  identificationNumber: string;
  phone: string;
  emergencyPhone: string;
  created_at: string;
  updated_at: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Manejo de CORS para OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({}),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` }),
    };
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });

    try {
      // Verificar si hay un ID en los parámetros de ruta
      const guestId = event.pathParameters?.guest_id;
      
      let query: string;
      let params: any[] = [];
      
      if (guestId) {
        // Obtener un huésped específico
        query = 'SELECT * FROM guest WHERE guest_id = ?';
        params = [guestId];
      } else {
        // Obtener todos los huéspedes (puedes añadir paginación aquí si es necesario)
        query = 'SELECT * FROM guest';
      }

      const [rows] = await connection.execute(query, params);
      const guests = rows as Guest[];

      if (guestId && guests.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS, GET",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify({ error: 'Guest not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": '*',
          "Access-Control-Allow-Methods": "OPTIONS, GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify(guestId ? guests[0] : guests),
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
    }

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { details: error.message } 
          : {})
      }),
    };
  }
};