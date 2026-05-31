import { getAdminDb } from '@/lib/supabase/admin'
import { mergeMetadataCreditValue } from '@/lib/credits'
import { FOLDER_SCHEME, normalizeFolderPath, parentFolderPath } from '@/lib/assets/folders'

const BUCKET = 'user-assets'

export const MARKETPLACE_BUYS_FOLDER = '/MARKETPLACE BUYS'

export const WORKSPACE_FOLDER_DEFS = [
  {
    path: '/Getting Started',
    name: 'Getting Started',
    description: 'Onboarding guides and Espeezy tips',
  },
  {
    path: '/Coursework',
    name: 'Coursework',
    description: 'Notes, briefs, and assignment files',
  },
  {
    path: MARKETPLACE_BUYS_FOLDER,
    name: 'MARKETPLACE BUYS',
    description: 'Campus marketplace purchases land here automatically',
  },
  {
    path: '/Downloads',
    name: 'Downloads',
    description: 'Saved files and exports',
  },
] as const

type SeedTextFile = {
  seedKey: string
  filename: string
  title: string
  description: string
  folderPath: '/Getting Started'
  content: string
}

const ONBOARDING_TEXT_FILES: SeedTextFile[] = [
  {
    seedKey: 'welcome',
    filename: 'welcome-to-espeezy.txt',
    title: 'Welcome to Espeezy.txt',
    description: 'Start here — how Espeezy helps your team document real contribution.',
    folderPath: '/Getting Started',
    content: `Welcome to Espeezy
==================

Espeezy is built for student teams. A 12-member platform team runs the backend that keeps your workspace online.

What you can do today:
• Kanban boards with contribution tracking
• Personal Arsenal folders for files and links
• Campus marketplace (buy and sell with Espeezy credits)
• Group health and academic integrity tools on Pro/Premium

Open Personal Arsenal (/assets) to browse your folders. Purchases from the marketplace are saved under "MARKETPLACE BUYS".

— Espeezy Platform Team
`,
  },
  {
    seedKey: 'arsenal-folders',
    filename: 'personal-arsenal-guide.txt',
    title: 'Personal Arsenal & Folders.txt',
    description: 'How folders, uploads, and credit values work.',
    folderPath: '/Getting Started',
    content: `Personal Arsenal — Quick Guide
==============================

Folders
-------
• "Getting Started" — these onboarding files
• "Coursework" — your study materials
• "MARKETPLACE BUYS" — auto-filled when you purchase listings
• "Downloads" — anything you want to keep handy

Upload tips
-----------
1. Pick a folder, then upload PDFs, images, or paste links.
2. Set a credit value (0–100) before listing on the marketplace.
3. List from an asset card when you are ready to sell.

Need help? support@espeezy.com
`,
  },
  {
    seedKey: 'marketplace-credits',
    filename: 'marketplace-and-credits.txt',
    title: 'Marketplace & Credits.txt',
    description: 'Buying, selling, and where purchases are stored.',
    folderPath: '/Getting Started',
    content: `Marketplace & Espeezy Credits
=============================

Credits
-------
• Default wallet balance is shown in Settings → Billing.
• Purchases deduct credits; sales credit the seller (minus platform fee).

After you buy
-------------
Every purchase is copied into Personal Arsenal → MARKETPLACE BUYS.
Digital downloads include a link or file in that folder.

Selling
-------
List assets from your arsenal or create a listing on /marketplace.
Physical items are one buyer only; digital items can have quantity.

Plans and checkout: espeezy.com/pricing
`,
  },
  {
    seedKey: 'kanban-tour',
    filename: 'kanban-workspace-tour.txt',
    title: 'Kanban Workspace Tour.txt',
    description: 'Columns, tasks, and contribution scoring basics.',
    folderPath: '/Getting Started',
    content: `Kanban Workspace Tour
=====================

1. Dashboard — see your active group board.
2. Move tasks: To Do → In Progress → Done (Done earns contribution points).
3. Assign owners on each card so instructors can review who completed each task.
4. Use Project Stats and Break Room on Pro/Premium plans.

Finish the onboarding tasks on your dashboard for bonus credits.

Happy collaborating!
`,
  },
]

type AdminDb = ReturnType<typeof getAdminDb>

async function listFolderPaths(db: AdminDb, userId: string): Promise<Set<string>> {
  const { data: markers } = await db
    .from('personal_assets')
    .select('metadata')
    .eq('user_id', userId)
    .eq('asset_url', FOLDER_SCHEME)

  const paths = new Set<string>()
  for (const row of markers ?? []) {
    const meta = row.metadata as { folder_path?: string } | null
    if (meta?.folder_path) paths.add(normalizeFolderPath(meta.folder_path))
  }
  return paths
}

export async function ensureFolderExists(
  db: AdminDb,
  userId: string,
  folderPath: string,
  displayName?: string,
): Promise<string> {
  const normalized = normalizeFolderPath(folderPath)
  const existing = await listFolderPaths(db, userId)
  if (existing.has(normalized)) return normalized

  const name =
    displayName ??
    WORKSPACE_FOLDER_DEFS.find((f) => f.path === normalized)?.name ??
    normalized.split('/').filter(Boolean).pop() ??
    'Folder'

  const parent = parentFolderPath(normalized)

  const { error } = await db.from('personal_assets').insert({
    user_id: userId,
    title: name,
    description: 'Virtual folder',
    asset_type: 'link',
    asset_url: FOLDER_SCHEME,
    size_bytes: 0,
    folder: parent,
    metadata: mergeMetadataCreditValue(
      { is_folder: true, folder_path: normalized, workspace_seed: true },
      0,
    ),
  })

  if (error) throw error
  return normalized
}

async function seedExists(db: AdminDb, userId: string, seedKey: string): Promise<boolean> {
  const { data } = await db
    .from('personal_assets')
    .select('id')
    .eq('user_id', userId)
    .filter('metadata->>workspace_seed_key', 'eq', seedKey)
    .limit(1)
    .maybeSingle()
  return Boolean(data?.id)
}

async function insertSeedTextFile(db: AdminDb, userId: string, file: SeedTextFile): Promise<boolean> {
  if (await seedExists(db, userId, file.seedKey)) return false

  await ensureFolderExists(db, userId, file.folderPath)

  const bytes = new TextEncoder().encode(file.content)
  const folderSegment = file.folderPath.replace(/^\//, '')
  const storagePath = `${userId}/${folderSegment}/${Date.now()}-${file.filename}`

  const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: 'text/plain; charset=utf-8',
    upsert: false,
  })

  if (uploadError) {
    console.error('[workspace-seed] upload failed', file.seedKey, uploadError.message)
    return false
  }

  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(storagePath)

  const { error: insertError } = await db.from('personal_assets').insert({
    user_id: userId,
    title: file.title,
    description: file.description,
    asset_type: 'file',
    asset_url: publicUrl,
    size_bytes: bytes.length,
    folder: normalizeFolderPath(file.folderPath),
    metadata: mergeMetadataCreditValue(
      {
        workspace_seed: true,
        workspace_seed_key: file.seedKey,
        storage_path: storagePath,
      },
      0,
    ),
  })

  if (insertError) {
    await db.storage.from(BUCKET).remove([storagePath])
    throw insertError
  }

  if (bytes.length > 0) {
    const { error: rpcError } = await db.rpc('increment_storage_used', { user_id: userId, amount: bytes.length })
    if (rpcError) console.error('[workspace-seed] storage increment', rpcError.message)
  }

  return true
}

export type WorkspaceSeedResult = {
  foldersCreated: number
  filesCreated: number
  alreadySeeded: boolean
}

/** Idempotent: default folders + onboarding txt files for a user. */
export async function ensureUserWorkspaceSeed(userId: string): Promise<WorkspaceSeedResult> {
  const db = getAdminDb()
  const before = await listFolderPaths(db, userId)

  let foldersCreated = 0
  for (const def of WORKSPACE_FOLDER_DEFS) {
    if (!before.has(def.path)) {
      await ensureFolderExists(db, userId, def.path, def.name)
      foldersCreated += 1
    }
  }

  let filesCreated = 0
  for (const file of ONBOARDING_TEXT_FILES) {
    const created = await insertSeedTextFile(db, userId, file)
    if (created) filesCreated += 1
  }

  const after = await listFolderPaths(db, userId)
  const alreadySeeded =
    before.size >= WORKSPACE_FOLDER_DEFS.length && filesCreated === 0 && foldersCreated === 0

  return { foldersCreated, filesCreated, alreadySeeded }
}

export type MarketplacePurchaseAssetInput = {
  listingId: string
  purchaseId: string
  invoiceNumber?: string
  title: string
  description?: string | null
  category?: string | null
  price?: number
  images?: string[] | null
  ownerId: string
  listingType?: string | null
  deliveryKind?: string | null
  digitalUrl?: string | null
  digitalContent?: string | null
}

/** Add a purchased listing to MARKETPLACE BUYS (and optional download file). */
export async function addMarketplacePurchaseToArsenal(
  buyerId: string,
  input: MarketplacePurchaseAssetInput,
): Promise<void> {
  const db = getAdminDb()

  const { data: existingPurchase } = await db
    .from('personal_assets')
    .select('id')
    .eq('user_id', buyerId)
    .filter('metadata->>purchase_id', 'eq', input.purchaseId)
    .limit(1)
    .maybeSingle()

  if (existingPurchase?.id) return

  await ensureUserWorkspaceSeed(buyerId)
  const folder = await ensureFolderExists(db, buyerId, MARKETPLACE_BUYS_FOLDER, 'MARKETPLACE BUYS')

  const isDigital = input.listingType === 'digital'
  const delivery = input.deliveryKind ?? (isDigital ? 'file' : 'meetup')

  const baseMeta = {
    listing_id: input.listingId,
    purchase_id: input.purchaseId,
    invoice_number: input.invoiceNumber ?? null,
    price: input.price ?? 0,
    owner_id: input.ownerId,
    purchased: true,
    purchased_at: new Date().toISOString(),
    listing_type: input.listingType ?? 'physical',
    delivery_kind: delivery,
    marketplace_folder: folder,
  }

  if (isDigital && delivery === 'link' && input.digitalUrl?.trim()) {
    await db.from('personal_assets').insert({
      user_id: buyerId,
      title: input.title,
      description: input.description ?? 'Purchased marketplace link',
      asset_type: 'link',
      asset_url: input.digitalUrl.trim(),
      preview_url: input.images?.[0] ?? null,
      category: input.category,
      folder,
      size_bytes: 0,
      metadata: mergeMetadataCreditValue(baseMeta, 0),
    })
    return
  }

  if (isDigital && delivery === 'file' && input.digitalContent?.trim()) {
    const bytes = new TextEncoder().encode(input.digitalContent)
    const safeName = `${input.title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80)}.txt`
    const storagePath = `${buyerId}/MARKETPLACE BUYS/${Date.now()}-${safeName}`

    const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: 'text/plain; charset=utf-8',
      upsert: false,
    })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = db.storage.from(BUCKET).getPublicUrl(storagePath)

      await db.from('personal_assets').insert({
        user_id: buyerId,
        title: safeName,
        description: input.description ?? 'Purchased digital download',
        asset_type: 'file',
        asset_url: publicUrl,
        preview_url: input.images?.[0] ?? null,
        category: input.category,
        folder,
        size_bytes: bytes.length,
        metadata: mergeMetadataCreditValue(
          { ...baseMeta, storage_path: storagePath, digital_download: true },
          0,
        ),
      })

      if (bytes.length > 0) {
        const { error: rpcError } = await db.rpc('increment_storage_used', {
          user_id: buyerId,
          amount: bytes.length,
        })
        if (rpcError) console.error('[workspace-seed] purchase storage increment', rpcError.message)
      }
      return
    }
  }

  if (isDigital && input.digitalUrl?.trim()) {
    await db.from('personal_assets').insert({
      user_id: buyerId,
      title: input.title,
      description: input.description ?? 'Purchased digital item',
      asset_type: 'link',
      asset_url: input.digitalUrl.trim(),
      preview_url: input.images?.[0] ?? null,
      category: input.category,
      folder,
      size_bytes: 0,
      metadata: mergeMetadataCreditValue(baseMeta, 0),
    })
    return
  }

  await db.from('personal_assets').insert({
    user_id: buyerId,
    title: input.title,
    description: input.description ?? 'Purchased from campus marketplace',
    asset_type: 'marketplace_ref',
    asset_url: `/marketplace?purchase=${input.listingId}`,
    preview_url: input.images?.[0] ?? null,
    category: input.category,
    folder,
    size_bytes: 0,
    metadata: mergeMetadataCreditValue(baseMeta, 0),
  })
}

/** Backfill all profiles (service role). */
export async function seedWorkspaceForAllUsers(): Promise<{
  users: number
  foldersCreated: number
  filesCreated: number
}> {
  const db = getAdminDb()
  const { data: profiles } = await db.from('profiles').select('id')

  let users = 0
  let foldersCreated = 0
  let filesCreated = 0

  for (const row of profiles ?? []) {
    if (!row.id) continue
    const result = await ensureUserWorkspaceSeed(row.id)
    if (result.foldersCreated > 0 || result.filesCreated > 0) users += 1
    foldersCreated += result.foldersCreated
    filesCreated += result.filesCreated
  }

  return { users, foldersCreated, filesCreated }
}
