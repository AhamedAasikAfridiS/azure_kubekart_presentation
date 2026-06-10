$ErrorActionPreference = "Stop"

$pptxPath = Join-Path $PSScriptRoot "KubeCart_Application_Architecture.pptx"
$pngPath = Join-Path $PSScriptRoot "KubeCart_Application_Architecture.png"

$ppLayoutBlank = 12
$ppSaveAsOpenXmlPresentation = 24
$msoFalse = 0
$msoTrue = -1
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$msoTextOrientationHorizontal = 1
$msoConnectorStraight = 1
$msoArrowheadTriangle = 3
$ppAlignLeft = 1
$ppAlignCenter = 2
$ppAnchorTop = 1
$ppAnchorMiddle = 3

function Rgb([int]$r, [int]$g, [int]$b) {
    return $r + (256 * $g) + (65536 * $b)
}

$navy = Rgb 10 26 47
$slate = Rgb 71 85 105
$muted = Rgb 100 116 139
$white = Rgb 255 255 255
$canvas = Rgb 248 250 252
$line = Rgb 203 213 225
$azure = Rgb 0 120 212
$frontend = Rgb 16 185 129
$frontendFill = Rgb 236 253 245
$backend = Rgb 124 58 237
$backendFill = Rgb 245 243 255
$data = Rgb 245 158 11
$dataFill = Rgb 255 247 237
$worker = Rgb 239 68 68
$workerFill = Rgb 254 242 242
$externalFill = Rgb 224 242 254

function Add-Text {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [string]$Text,
        [single]$FontSize,
        [int]$Color,
        [bool]$Bold = $false,
        [int]$Align = 1,
        [int]$Anchor = 1
    )

    $shape = $Slide.Shapes.AddTextbox(
        $msoTextOrientationHorizontal,
        $Left,
        $Top,
        $Width,
        $Height
    )
    $shape.TextFrame2.TextRange.Text = $Text
    $shape.TextFrame2.TextRange.Font.Name = "Aptos"
    $shape.TextFrame2.TextRange.Font.Size = $FontSize
    $shape.TextFrame2.TextRange.Font.Bold = $(if ($Bold) { $msoTrue } else { $msoFalse })
    $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $Color
    $shape.TextFrame2.TextRange.ParagraphFormat.Alignment = $Align
    $shape.TextFrame2.VerticalAnchor = $Anchor
    $shape.TextFrame2.MarginLeft = 0
    $shape.TextFrame2.MarginRight = 0
    $shape.TextFrame2.MarginTop = 0
    $shape.TextFrame2.MarginBottom = 0
    return $shape
}

function Add-Box {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [int]$FillColor,
        [int]$LineColor,
        [single]$LineWeight = 1,
        [bool]$Rounded = $true
    )

    $type = $(if ($Rounded) { $msoShapeRoundedRectangle } else { $msoShapeRectangle })
    $shape = $Slide.Shapes.AddShape($type, $Left, $Top, $Width, $Height)
    $shape.Fill.ForeColor.RGB = $FillColor
    $shape.Fill.Solid()
    $shape.Line.ForeColor.RGB = $LineColor
    $shape.Line.Weight = $LineWeight
    return $shape
}

function Add-Node {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [string]$Title,
        [string]$Subtitle,
        [int]$Accent,
        [int]$Fill
    )

    $shape = Add-Box $Slide $Left $Top $Width $Height $Fill $Accent 1.25
    $shape.Shadow.Visible = $msoTrue
    $shape.Shadow.ForeColor.RGB = $navy
    $shape.Shadow.Transparency = 0.92
    $shape.Shadow.OffsetY = 2
    Add-Box $Slide $Left $Top 6 $Height $Accent $Accent 0 $false | Out-Null
    Add-Text $Slide ($Left + 14) ($Top + 9) ($Width - 24) 18 $Title 11 $navy $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-Text $Slide ($Left + 14) ($Top + 31) ($Width - 24) ($Height - 38) $Subtitle 7.5 $slate $false $ppAlignLeft $ppAnchorTop | Out-Null
}

function Add-Container {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [string]$Title,
        [string]$Path,
        [int]$Accent,
        [int]$Fill
    )

    $shape = Add-Box $Slide $Left $Top $Width $Height $Fill $Accent 1.5
    $shape.Fill.Transparency = 0.22
    Add-Text $Slide ($Left + 14) ($Top + 9) ($Width - 28) 20 $Title 12 $Accent $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-Text $Slide ($Left + 14) ($Top + 30) ($Width - 28) 14 $Path 7.5 $muted $false $ppAlignLeft $ppAnchorMiddle | Out-Null
}

function Add-Arrow {
    param(
        $Slide,
        [single]$X1,
        [single]$Y1,
        [single]$X2,
        [single]$Y2,
        [int]$Color,
        [single]$Weight = 1.5,
        [string]$Label = ""
    )

    $arrow = $Slide.Shapes.AddConnector($msoConnectorStraight, $X1, $Y1, $X2, $Y2)
    $arrow.Line.ForeColor.RGB = $Color
    $arrow.Line.Weight = $Weight
    $arrow.Line.EndArrowheadStyle = $msoArrowheadTriangle
    if ($Label) {
        $left = [Math]::Min($X1, $X2)
        $top = [Math]::Min($Y1, $Y2) - 13
        $width = [Math]::Max([Math]::Abs($X2 - $X1), 70)
        Add-Text $Slide $left $top $width 12 $Label 6.5 $muted $false $ppAlignCenter $ppAnchorMiddle | Out-Null
    }
}

$powerPoint = $null
$presentation = $null

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Add($msoTrue)
    $presentation.PageSetup.SlideWidth = 960
    $presentation.PageSetup.SlideHeight = 540

    $slide = $presentation.Slides.Add(1, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $canvas
    $slide.Background.Fill.Solid()

    Add-Box $slide 0 0 960 6 $azure $azure 0 $false | Out-Null
    Add-Text $slide 34 21 650 32 "KubeCart Application Architecture" 23 $navy $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-Text $slide 35 55 700 18 "Codebase-level view | React + Express modular monolith + asynchronous notification worker" 9.5 $slate $false $ppAlignLeft $ppAnchorMiddle | Out-Null

    # External actors and identity.
    Add-Node $slide 34 103 116 70 "Customer / Admin" "Browser user" $azure $externalFill
    Add-Node $slide 34 205 116 78 "Microsoft Entra ID" "Easy Auth session`nAdmin application role" $azure $externalFill

    # Frontend layer.
    Add-Container $slide 176 92 180 374 "React SPA" "Kubecart-frontend/src" $frontend $frontendFill
    Add-Node $slide 194 138 144 70 "Pages & Components" "Home, Products, Cart,`nOrders, Profile, Navbar" $frontend $white
    Add-Node $slide 194 229 144 70 "React Contexts" "AuthContext`nCartContext" $frontend $white
    Add-Node $slide 194 320 144 70 "Axios API Client" "Same-origin /api/*`nCookie-based session" $frontend $white

    # Backend monolith.
    Add-Container $slide 386 92 330 374 "Express Modular Monolith" "server.js + src/" $backend $backendFill
    Add-Node $slide 404 134 134 64 "Express Bootstrap" "Static React host`n/health and /api" $backend $white
    Add-Node $slide 558 134 140 64 "Middleware" "Helmet, rate limit, logs,`nvalidation, Entra roles" $backend $white
    Add-Node $slide 404 222 134 70 "Routes" "auth, products, cart,`norders, profiles, logs" $backend $white
    Add-Node $slide 558 222 140 70 "Controllers" "Domain orchestration`nDirect module calls" $backend $white
    Add-Node $slide 404 322 134 76 "Mongoose Models" "Product, Cart, Order,`nProfile, NotificationLog" $backend $white
    Add-Node $slide 558 322 140 76 "Queue Service" "notificationQueue.js`nService Bus sender" $backend $white

    # Data and async worker.
    Add-Node $slide 752 92 174 68 "Cosmos DB" "API for MongoDB`nShared application data" $data $dataFill
    Add-Node $slide 752 184 174 68 "Service Bus Queue" "notifications`nOrder event commands" $data $dataFill
    Add-Container $slide 752 278 174 188 "Azure Function" "notification-function/" $worker $workerFill
    Add-Node $slide 770 320 138 58 "Queue Trigger" "notificationProcessor.js" $worker $white
    Add-Node $slide 770 394 138 52 "Email + Log" "Nodemailer`nIdempotent status" $worker $white

    # Primary request flow.
    Add-Arrow $slide 150 138 176 138 $azure 1.8
    Add-Arrow $slide 92 205 92 173 $azure 1.5 "Sign in"
    Add-Arrow $slide 150 244 386 166 $azure 1.4 "Easy Auth principal headers"
    Add-Arrow $slide 266 208 266 229 $frontend 1.5
    Add-Arrow $slide 266 299 266 320 $frontend 1.5
    Add-Arrow $slide 338 355 404 166 $frontend 1.8 "HTTPS /api/*"

    # Backend code flow.
    Add-Arrow $slide 538 166 558 166 $backend 1.5
    Add-Arrow $slide 628 198 474 222 $backend 1.4
    Add-Arrow $slide 538 257 558 257 $backend 1.5
    Add-Arrow $slide 628 292 474 322 $backend 1.4
    Add-Arrow $slide 628 292 628 322 $backend 1.4

    # Data and notification flow.
    Add-Arrow $slide 538 360 752 126 $data 1.6 "Mongoose CRUD"
    Add-Arrow $slide 698 360 752 218 $data 1.6 "Notification command"
    Add-Arrow $slide 839 252 839 320 $worker 1.8 "Queue trigger"
    Add-Arrow $slide 839 378 839 394 $worker 1.5
    Add-Arrow $slide 908 420 944 420 $worker 1.5 "SMTP"
    Add-Arrow $slide 770 420 716 390 $data 1.4 "Log status"

    # Legend and architectural note.
    Add-Text $slide 36 491 145 15 "REQUEST FLOW" 7 $muted $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-Box $slide 122 496 26 2 $azure $azure 0 $false | Out-Null
    Add-Text $slide 190 491 180 15 "DIRECT MODULE CALLS" 7 $muted $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-Box $slide 298 496 26 2 $backend $backend 0 $false | Out-Null
    Add-Text $slide 390 486 530 24 "Modular monolith: domain controllers call models directly; no internal HTTP service-to-service calls." 8.5 $navy $true $ppAlignRight $ppAnchorMiddle | Out-Null

    if (Test-Path $pptxPath) {
        Remove-Item -LiteralPath $pptxPath -Force
    }
    if (Test-Path $pngPath) {
        Remove-Item -LiteralPath $pngPath -Force
    }

    $presentation.SaveAs($pptxPath, $ppSaveAsOpenXmlPresentation)
    $slide.Export($pngPath, "PNG", 1920, 1080)
    $presentation.Close()
    $presentation = $null
    $powerPoint.Quit()
    $powerPoint = $null

    Write-Output "Created: $pptxPath"
    Write-Output "Created: $pngPath"
}
finally {
    if ($null -ne $presentation) {
        try { $presentation.Close() } catch {}
    }
    if ($null -ne $powerPoint) {
        try { $powerPoint.Quit() } catch {}
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
