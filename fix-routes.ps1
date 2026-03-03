# fix-routes.ps1 - Version corrigée
Write-Host "🔧 Correction massive des route handlers..." -ForegroundColor Green

# Trouver tous les fichiers route.ts dans app/api/
$files = Get-ChildItem -Path app/api -Recurse -Filter "route.ts"

foreach ($file in $files) {
    Write-Host "📝 Traitement de $($file.FullName)" -ForegroundColor Yellow
    
    # Lire le contenu
    $content = Get-Content $file.FullName -Raw
    
    # Remplacer les signatures GET avec { id: string }
    $content = $content -replace '(export async function GET\(\s*request:\s*NextRequest\s*,\s*{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*id:\s*string\s*}\s*}\s*\))', 
        'export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> })'
    
    # Remplacer les signatures PUT avec { id: string }
    $content = $content -replace '(export async function PUT\(\s*request:\s*NextRequest\s*,\s*{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*id:\s*string\s*}\s*}\s*\))',
        'export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> })'
    
    # Remplacer les signatures DELETE avec { id: string }
    $content = $content -replace '(export async function DELETE\(\s*request:\s*NextRequest\s*,\s*{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*id:\s*string\s*}\s*}\s*\))',
        'export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> })'
    
    # Remplacer les signatures avec userId
    $content = $content -replace '(export async function GET\(\s*request:\s*NextRequest\s*,\s*{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*userId:\s*string\s*}\s*}\s*\))',
        'export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> })'
    
    # Remplacer les extractions directes de params.id
    $content = $content -replace 'const\s*{\s*id\s*}\s*=\s*params\s*;', 'const { id } = await params;'
    
    # Remplacer les extractions directes de params.userId
    $content = $content -replace 'const\s*{\s*userId\s*}\s*=\s*params\s*;', 'const { userId } = await params;'
    
    # Remplacer les parseInt directs
    $content = $content -replace 'const\s+id\s*=\s*parseInt\(\s*params\.id\s*\)\s*;', 'const { id } = await params; const idNum = parseInt(id);'
    
    # Sauvegarder
    $content | Set-Content $file.FullName -NoNewline -Encoding UTF8
    
    Write-Host "  ✅ Corrigé" -ForegroundColor Green
}

Write-Host "🎉 Tous les fichiers ont été corrigés !" -ForegroundColor Green
Write-Host "🚀 Exécutez maintenant: git add . ; git commit -m 'Correction route handlers' ; git push" -ForegroundColor Yellow