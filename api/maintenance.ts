import { getAll } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    const maintenanceConfig = await getAll<{
      isUnderMaintenance: boolean;
      title: string;
      message: string;
    }>();

    return new Response(JSON.stringify(maintenanceConfig), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to fetch maintenance config from Edge Config:', error);
    
    // Return default "not in maintenance" state on error
    return new Response(
      JSON.stringify({
        isUnderMaintenance: false,
        title: '',
        message: '',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
