import { NextRequest, NextResponse } from 'next/server';
import { ConduitDatabase } from '@/lib/aos/db';
import { ConduitEngine } from '@/lib/aos/engine'; // Added this import

export async function POST(req: NextRequest) {
    try {
        const { path, access_level, status, scope } = await req.json();
        const db = new ConduitDatabase(process.cwd());
        const engine = ConduitEngine.getInstance();

        if (scope === 'session') {
            if (status === 'GRANTED') {
                engine.sessionPermissions.add(path);
            } else {
                engine.sessionPermissions.delete(path); // Or handle denied explicitly if set used for allowlist
            }
        } else {
            // "Always" or "Forever" -> DB
            db.setPermission(path, access_level || 'READ', status);
            // Also add to session so it works immediately without re-fetch if we check both
            if (status === 'GRANTED') engine.sessionPermissions.add(path);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
