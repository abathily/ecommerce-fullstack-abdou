<# 
.SYNOPSIS
  Détecte les définitions de routes Express potentiellement fragiles:
  - gabarits avec interpolation (ex: `/users/${id}`)
  - concaténations de chaînes (ex: '/users/' + id)
  - paramètres invalides après ':'

.DESCRIPTION
  Heuristiques simples, scan ligne par ligne, pour app.|router.<method>(...).
  Evite d'utiliser la séquence ${...} textuelle dans les chaînes PowerShell.

.PARAMETER Path
  Répertoire racine à analyser (défaut: .)

.PARAMETER Extensions
  Extensions à inclure (défaut: *.js, *.mjs, *.cjs, *.ts, *.tsx)

.PARAMETER OutFile
  Fichier d'export (json ou csv). Si absent, affiche seulement en console.

.PARAMETER Json
  Force sortie JSON dans la console.

.EXAMPLE
  .\detectDynamicRoutes.ps1

.EXAMPLE
  .\detectDynamicRoutes.ps1 -Path .\src -OutFile findings.json -Json
#>

[CmdletBinding()]
param(
  [Parameter(Position=0)]
  [string]$Path = ".",

  [string[]]$Extensions = @("*.js","*.mjs","*.cjs","*.ts","*.tsx"),

  [string]$OutFile,

  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Motif d'appel: app.<method>( ou router.<method>(
$methodCallPattern = '(?:\bapp\b|\brouter\b)\s*\.\s*(?:get|post|put|delete|patch|use|all)\s*\('

# Gabarits backticks avec interpolation dans le 1er argument: `...${...}...`
# Note: backticks et $ sont littéraux car la chaîne est entre quotes simples.
$templateInterpolationPattern = '(?:\bapp\b|\brouter\b)\s*\.\s*(?:get|post|put|delete|patch|use|all)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`'

# Concaténation dans le 1er argument avant la 1re virgule
$concatInFirstArgPattern = '(?:\bapp\b|\brouter\b)\s*\.\s*(?:get|post|put|delete|patch|use|all)\s*\(\s*[^,]*\+[^,]*,'

# Trouver les tokens de paramètre après ':'
$paramTokenFinder = '/:([^/()\s,]+)'

# Cas spécifique: '/:${' littéral
$badParamWithTemplateMarker = '/:\$\{'

# Suggestions
$suggestionUseParamHere = @'
Utilise un paramètre Express statique: '/users/:userId'
Puis récupère-le dans le contrôleur: req.params.userId
'@

$suggestionAvoidConcatHere = @'
Evite la concaténation ou les gabarits dans la définition des routes.
Préfère une route statique avec paramètre: '/orders/:orderId'
'@

$suggestionFixParamName = @'
Renomme le paramètre pour respecter: lettres/chiffres/underscore, en commençant par une lettre ou underscore.
Exemples valides: ':id', ':userId', ':order_2'
Exemple invalide: ':user-id' (remplacer par ':userId' ou ':user_id')
'@

function Get-Files {
  param(
    [string]$Root,
    [string[]]$Exts
  )
  $files = @()
  foreach ($ext in $Exts) {
    # -Filter est plus fiable avec -Recurse que -Include
    $files += Get-ChildItem -Path $Root -Recurse -File -Filter $ext -ErrorAction SilentlyContinue
  }
  return $files | Sort-Object FullName -Unique
}

function Test-LineForIssues {
  param(
    [string]$Line,
    [int]$LineNumber,
    [string]$File
  )

  $issues = New-Object System.Collections.Generic.List[object]

  # Filtre rapide
  if ($Line -notmatch '\b(app|router)\b' -or $Line -notmatch '\(') {
    return $issues
  }

  # 1) Gabarits + interpolation dans le 1er argument
  if ($Line -match $templateInterpolationPattern) {
    $issues.Add([pscustomobject]@{
      File        = $File
      Line        = $LineNumber
      Issue       = 'Interpolation dynamique dans le chemin de route (gabarit avec expression)'
      Rule        = 'NoTemplateInterpolationInRoute'
      Snippet     = ($Line.Trim() | ForEach-Object { if ($_.Length -gt 240) { $_.Substring(0,240) + ' ...' } else { $_ } })
      Suggestion  = $suggestionUseParamHere.Trim()
      Severity    = 'High'
    })
  }

  # 2) Concaténation dans le 1er argument
  if ($Line -match $concatInFirstArgPattern) {
    $issues.Add([pscustomobject]@{
      File        = $File
      Line        = $LineNumber
      Issue       = 'Concaténation de chaînes dans le chemin de route'
      Rule        = 'NoConcatenationInRoute'
      Snippet     = ($Line.Trim() | ForEach-Object { if ($_.Length -gt 240) { $_.Substring(0,240) + ' ...' } else { $_ } })
      Suggestion  = $suggestionAvoidConcatHere.Trim()
      Severity    = 'High'
    })
  }

  # 3) Paramètre littéral avec marqueur de gabarit
  if ($Line -match $badParamWithTemplateMarker -and $Line -match $methodCallPattern) {
    $issues.Add([pscustomobject]@{
      File        = $File
      Line        = $LineNumber
      Issue       = 'Paramètre de route invalide du type /:${...}'
      Rule        = 'InvalidParamTemplateMarker'
      Snippet     = ($Line.Trim() | ForEach-Object { if ($_.Length -gt 240) { $_.Substring(0,240) + ' ...' } else { $_ } })
      Suggestion  = $suggestionUseParamHere.Trim()
      Severity    = 'High'
    })
  }

  # 4) Paramètres après ':' — valider le nom
  if ($Line -match $methodCallPattern) {
    $paramMatches = [System.Text.RegularExpressions.Regex]::Matches($Line, $paramTokenFinder)
    foreach ($m in $paramMatches) {
      $token = $m.Groups[1].Value

      # Autorisé: 'id', 'userId', 'order_2', 'id?'
      $isValid = ($token -match '^[A-Za-z_][A-Za-z0-9_]*\??$')
      if (-not $isValid) {
        $issues.Add([pscustomobject]@{
          File        = $File
          Line        = $LineNumber
          Issue       = "Nom de paramètre invalide ':$token'"
          Rule        = 'InvalidParamName'
          Snippet     = ($Line.Trim() | ForEach-Object { if ($_.Length -gt 240) { $_.Substring(0,240) + ' ...' } else { $_ } })
          Suggestion  = $suggestionFixParamName.Trim()
          Severity    = 'Medium'
        })
      }
    }
  }

  return $issues
}

function Scan-File {
  param([string]$FilePath)

  $results = New-Object System.Collections.Generic.List[object]
  $lineNo = 0

  # Lecture ligne par ligne
  Get-Content -LiteralPath $FilePath -ErrorAction Stop | ForEach-Object {
    $lineNo++
    $issues = Test-LineForIssues -Line $_ -LineNumber $lineNo -File $FilePath
    foreach ($i in $issues) { $results.Add($i) }
  }

  return $results
}

# Collecte des fichiers
$allFiles = Get-Files -Root $Path -Exts $Extensions
if (-not $allFiles -or $allFiles.Count -eq 0) {
  Write-Warning ("Aucun fichier trouvé sous '{0}' avec extensions: {1}" -f $Path, ($Extensions -join ', '))
  return
}

$findings = New-Object System.Collections.Generic.List[object]
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($f in $allFiles) {
  try {
    $fileFindings = Scan-File -FilePath $f.FullName
    foreach ($x in $fileFindings) { $findings.Add($x) }
  } catch {
    $warningMessage = "Fichier ignore (lecture impossible): " + $f.FullName + " - " + $_.Exception.Message
    Write-Warning $warningMessage
  }
}

$stopwatch.Stop()

# Sortie console
Write-Host ""
Write-Host ("Analyse terminee en {0}s - Fichiers scannes: {1} - Problemes trouves: {2}" -f [Math]::Round($stopwatch.Elapsed.TotalSeconds,2), $allFiles.Count, $findings.Count) -ForegroundColor Cyan
Write-Host ""

if ($findings.Count -eq 0) {
  Write-Host "OK - Aucun motif problematique detecte dans les definitions de routes." -ForegroundColor Green
  return
}

$findings |
  Select-Object File, Line, Issue, Severity, @{n='Snippet';e={ $_.Snippet }} |
  Sort-Object Severity, File, Line |
  Format-Table -AutoSize

# Export éventuel
if ($OutFile) {
  $ext = [System.IO.Path]::GetExtension($OutFile).ToLowerInvariant()
  try {
    if ($ext -eq '.json' -or $Json) {
      $findings | ConvertTo-Json -Depth 5 | Out-File -LiteralPath $OutFile -Encoding UTF8
      Write-Host "`nExport JSON -> $OutFile" -ForegroundColor Yellow
    } elseif ($ext -eq '.csv') {
      $findings | Export-Csv -LiteralPath $OutFile -NoTypeInformation -Encoding UTF8
      Write-Host "`nExport CSV -> $OutFile" -ForegroundColor Yellow
    } else {
      $findings | ConvertTo-Json -Depth 5 | Out-File -LiteralPath $OutFile -Encoding UTF8
      Write-Warning ("Extension '{0}' non reconnue - export JSON par defaut -> {1}" -f $ext, $OutFile)
    }
  } catch {
    $errorMessage = "Echec de l'export vers '" + $OutFile + "' - " + $_.Exception.Message
    Write-Warning $errorMessage
  }
}

# Optionnel: sortie JSON dans la console
if ($Json -and -not $OutFile) {
  $findings | ConvertTo-Json -Depth 5
}
