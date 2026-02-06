import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    console.log('Upload API called')

    // Preferir variáveis server-side; se não existir, cai nas NEXT_PUBLIC_ (fallback)
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

    // Para upload no Storage, o ideal é SERVICE_ROLE no server (se você tiver).
    // Se não tiver, usa ANON.
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase not configured (missing env vars)')
        return NextResponse.json(
            { error: 'Storage not configured' },
            { status: 500 }
        )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)

        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}_${sanitizedName}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabase.storage
            .from('Postagens')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json(
                { error: `Storage error: ${error.message}` },
                { status: 500 }
            )
        }

        const { data: urlData } = supabase.storage.from('Postagens').getPublicUrl(fileName)

        console.log('Upload successful:', urlData.publicUrl)

        return NextResponse.json({
            url: urlData.publicUrl,
            name: file.name,
            path: data.path,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed: ' + (error as Error).message },
            { status: 500 }
        )
    }
}
