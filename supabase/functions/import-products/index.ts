import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductRow {
  code: string;
  description: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { content } = await req.json()
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting import process...')
    
    // Parse the content
    const lines = content.split('\n').filter(line => line.trim())
    const productsToInsert: ProductRow[] = []
    
    for (const line of lines) {
      const parts = line.split(';')
      if (parts.length >= 3) {
        const internalCode = parts[0]?.trim()
        const barcode = parts[1]?.trim()
        const description = parts[2]?.trim()

        // Use internal code if barcode is 0000000000000
        const productCode = barcode === '0000000000000' ? internalCode : barcode

        if (productCode && description) {
          productsToInsert.push({
            code: productCode.toUpperCase(),
            description: description.toUpperCase().substring(0, 200)
          })
        }
      }
    }

    console.log(`Parsed ${productsToInsert.length} products from ${lines.length} lines`)

    if (productsToInsert.length === 0) {
      return new Response(
        JSON.stringify({ imported: 0, message: 'No valid products found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use UPSERT to insert/update products in batches
    const batchSize = 1000
    let totalImported = 0
    let totalSkipped = 0

    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToInsert.length / batchSize)}: ${batch.length} products`)

      // Use upsert to avoid duplicates
      const { data, error } = await supabase
        .from('products')
        .upsert(batch, { 
          onConflict: 'code',
          ignoreDuplicates: false 
        })
        .select('id, code')

      if (error) {
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
        
        // Try individual inserts for this batch to skip duplicates
        for (const product of batch) {
          const { error: insertError } = await supabase
            .from('products')
            .insert(product)
          
          if (insertError) {
            if (insertError.code === '23505') {
              totalSkipped++
            } else {
              console.error('Insert error:', insertError)
            }
          } else {
            totalImported++
          }
        }
      } else {
        totalImported += batch.length
      }
    }

    console.log(`Import completed: ${totalImported} imported, ${totalSkipped} skipped`)

    return new Response(
      JSON.stringify({ 
        imported: totalImported, 
        skipped: totalSkipped,
        total: productsToInsert.length,
        message: `Successfully imported ${totalImported} products${totalSkipped > 0 ? `, ${totalSkipped} already existed` : ''}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})