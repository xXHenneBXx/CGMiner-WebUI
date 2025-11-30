import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CGMinerRequest {
  command: string;
  host?: string;
  port?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { command, host = 'localhost', port = 4028 }: CGMinerRequest = await req.json();

    if (!command) {
      return new Response(
        JSON.stringify({ error: 'Command is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const cgminerResponse = await sendCGMinerCommand(host, port, command);

    return new Response(
      JSON.stringify(cgminerResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('CGMiner API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function sendCGMinerCommand(host: string, port: number, command: string): Promise<any> {
  try {
    const conn = await Deno.connect({ hostname: host, port });

    const payload = JSON.stringify({ command }) + '\n';
    await conn.write(new TextEncoder().encode(payload));

    const buffer = new Uint8Array(65536);
    let response = '';
    let bytesRead = 0;

    while (true) {
      const n = await conn.read(buffer);
      if (n === null) break;
      
      bytesRead += n;
      response += new TextDecoder().decode(buffer.subarray(0, n));
      
      if (response.includes('\0') || bytesRead >= 65536) {
        break;
      }
    }

    conn.close();

    response = response.replace(/\0/g, '').trim();
    
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse CGMiner response:', response);
      return { error: 'Invalid response from CGMiner', raw: response };
    }
  } catch (error) {
    throw new Error(`Failed to connect to CGMiner at ${host}:${port} - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
