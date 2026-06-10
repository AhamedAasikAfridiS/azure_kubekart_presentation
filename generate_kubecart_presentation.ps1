$ErrorActionPreference = "Stop"

$outputPath = Join-Path $PSScriptRoot "KubeCart_Azure_PaaS_Presentation_Updated.pptx"

$ppLayoutBlank = 12
$ppSaveAsOpenXmlPresentation = 24
$msoFalse = 0
$msoTrue = -1
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$msoShapeHexagon = 10
$msoShapeArc = 25
$msoShapeCloud = 179
$msoTextOrientationHorizontal = 1
$msoLineDash = 4
$ppAlignLeft = 1
$ppAlignCenter = 2
$ppAlignRight = 3
$ppAnchorTop = 1
$ppAnchorMiddle = 3

function Rgb([int]$r, [int]$g, [int]$b) {
    return $r + (256 * $g) + (65536 * $b)
}

$navy = Rgb 10 26 47
$navy2 = Rgb 18 43 70
$azure = Rgb 0 120 212
$azureLight = Rgb 44 153 236
$cyan = Rgb 48 198 238
$white = Rgb 255 255 255
$offWhite = Rgb 245 249 252
$slate = Rgb 67 85 103
$muted = Rgb 148 163 184
$line = Rgb 203 213 225
$green = Rgb 16 185 129
$purple = Rgb 124 58 237
$orange = Rgb 245 158 11

function Add-TextBox {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [string]$Text,
        [single]$FontSize,
        [int]$Color,
        [string]$Font = "Aptos",
        [bool]$Bold = $false,
        [int]$Align = 1,
        [int]$VerticalAnchor = 1
    )

    $shape = $Slide.Shapes.AddTextbox(
        $msoTextOrientationHorizontal,
        $Left,
        $Top,
        $Width,
        $Height
    )
    $shape.TextFrame2.TextRange.Text = $Text
    $shape.TextFrame2.TextRange.Font.Name = $Font
    $shape.TextFrame2.TextRange.Font.Size = $FontSize
    $shape.TextFrame2.TextRange.Font.Bold = $(if ($Bold) { $msoTrue } else { $msoFalse })
    $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $Color
    $shape.TextFrame2.TextRange.ParagraphFormat.Alignment = $Align
    $shape.TextFrame2.VerticalAnchor = $VerticalAnchor
    $shape.TextFrame2.MarginLeft = 0
    $shape.TextFrame2.MarginRight = 0
    $shape.TextFrame2.MarginTop = 0
    $shape.TextFrame2.MarginBottom = 0
    return $shape
}

function Add-Rectangle {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [int]$FillColor,
        [int]$LineColor = -1,
        [single]$Radius = 0
    )

    $shapeType = $(if ($Radius -gt 0) { $msoShapeRoundedRectangle } else { $msoShapeRectangle })
    $shape = $Slide.Shapes.AddShape($shapeType, $Left, $Top, $Width, $Height)
    $shape.Fill.ForeColor.RGB = $FillColor
    $shape.Fill.Solid()
    if ($LineColor -eq -1) {
        $shape.Line.Visible = $msoFalse
    } else {
        $shape.Line.Visible = $msoTrue
        $shape.Line.ForeColor.RGB = $LineColor
        $shape.Line.Weight = 1
    }
    return $shape
}

function Add-Circle {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Size,
        [int]$FillColor,
        [int]$LineColor = -1
    )

    $shape = $Slide.Shapes.AddShape($msoShapeOval, $Left, $Top, $Size, $Size)
    $shape.Fill.ForeColor.RGB = $FillColor
    $shape.Fill.Solid()
    if ($LineColor -eq -1) {
        $shape.Line.Visible = $msoFalse
    } else {
        $shape.Line.Visible = $msoTrue
        $shape.Line.ForeColor.RGB = $LineColor
        $shape.Line.Weight = 1
    }
    return $shape
}

function Add-SlideNumber {
    param($Slide, [int]$Number, [int]$Color)
    Add-TextBox $Slide 892 505 34 16 ($Number.ToString("00")) 9 $Color "Aptos" $true $ppAlignRight $ppAnchorMiddle | Out-Null
}

function Add-TopBar {
    param($Slide, [string]$Section)
    Add-Rectangle $Slide 0 0 960 5 $azure | Out-Null
    Add-TextBox $Slide 48 24 190 18 $Section.ToUpperInvariant() 10 $azure "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
}

function Add-ServiceCard {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [string]$Initials,
        [string]$Title,
        [string]$Description,
        [int]$Accent
    )

    $card = Add-Rectangle $Slide $Left $Top 202 278 $white $line 8
    $card.Shadow.Visible = $msoTrue
    $card.Shadow.ForeColor.RGB = Rgb 15 23 42
    $card.Shadow.Transparency = 0.88
    $card.Shadow.OffsetX = 0
    $card.Shadow.OffsetY = 3

    Add-Rectangle $Slide $Left $Top 202 7 $Accent | Out-Null
    Add-Circle $Slide ($Left + 20) ($Top + 24) 54 $Accent | Out-Null
    Add-TextBox $Slide ($Left + 20) ($Top + 24) 54 54 $Initials 17 $white "Aptos Display" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $Slide ($Left + 20) ($Top + 94) 162 52 $Title 18 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorTop | Out-Null
    Add-TextBox $Slide ($Left + 20) ($Top + 158) 162 82 $Description 11 $slate "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null
    Add-TextBox $Slide ($Left + 20) ($Top + 246) 162 14 "AZURE PAAS" 8 $Accent "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
}

function Add-ImagePlaceholder {
    param(
        $Slide,
        [single]$Left,
        [single]$Top,
        [single]$Width,
        [single]$Height,
        [string]$Number,
        [string]$Label,
        [string]$Hint
    )

    $frame = Add-Rectangle $Slide $Left $Top $Width $Height $offWhite $line 6
    $frame.Line.DashStyle = $msoLineDash
    $frame.Line.Weight = 1.5

    $iconX = $Left + ($Width / 2) - 18
    $iconY = $Top + 36
    Add-Rectangle $Slide $iconX $iconY 36 30 $white $azure 2 | Out-Null
    $sun = Add-Circle $Slide ($iconX + 23) ($iconY + 5) 6 $orange
    $sun.Line.Visible = $msoFalse
    $mountain = $Slide.Shapes.AddShape(7, ($iconX + 5), ($iconY + 13), 25, 12)
    $mountain.Fill.ForeColor.RGB = $azureLight
    $mountain.Fill.Solid()
    $mountain.Line.Visible = $msoFalse

    Add-TextBox $Slide ($Left + 18) ($Top + 86) ($Width - 36) 22 $Label 15 $navy "Aptos Display" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $Slide ($Left + 20) ($Top + 112) ($Width - 40) 32 $Hint 9.5 $muted "Aptos" $false $ppAlignCenter $ppAnchorTop | Out-Null
    Add-Circle $Slide ($Left + 14) ($Top + 14) 26 $azure | Out-Null
    Add-TextBox $Slide ($Left + 14) ($Top + 14) 26 26 $Number 10 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
}

$powerPoint = $null
$presentation = $null

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Add($msoTrue)
    $presentation.PageSetup.SlideWidth = 960
    $presentation.PageSetup.SlideHeight = 540

    # Slide 1: Introduction
    $slide = $presentation.Slides.Add(1, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $navy
    $slide.Background.Fill.Solid()

    Add-Rectangle $slide 0 0 11 540 $azure | Out-Null
    Add-Circle $slide 720 -90 300 $azure | Out-Null
    Add-Circle $slide 785 15 210 $navy2 | Out-Null
    Add-Circle $slide 835 70 110 $cyan | Out-Null

    Add-TextBox $slide 66 66 270 24 "AZURE PAAS PROJECT" 12 $cyan "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 66 124 620 118 "KubeCart" 54 $white "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 69 235 630 58 "Secure E-Commerce Platform on Microsoft Azure" 24 $offWhite "Aptos Display" $false $ppAlignLeft $ppAnchorTop | Out-Null
    Add-Rectangle $slide 69 320 82 4 $azure | Out-Null
    Add-TextBox $slide 69 346 590 64 "A monolithic Node.js and React application built with managed Azure platform services." 16 $muted "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null

    Add-Rectangle $slide 69 452 225 34 $navy2 (Rgb 51 78 104) 6 | Out-Null
    Add-TextBox $slide 86 452 191 34 "PROJECT PRESENTATION" 10 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-SlideNumber $slide 1 $muted

    # Slide 2: Azure PaaS services
    $slide = $presentation.Slides.Add(2, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $offWhite
    $slide.Background.Fill.Solid()
    Add-TopBar $slide "Technology"
    Add-TextBox $slide 48 55 680 44 "Azure PaaS Services Used" 30 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 48 102 720 26 "Managed services keep KubeCart scalable, secure, and easier to operate." 13 $slate "Aptos" $false $ppAlignLeft $ppAnchorMiddle | Out-Null

    Add-ServiceCard $slide 48 156 "AS" "Azure App Service" "Hosts the Node.js API and serves the React frontend as one managed web application." $azure
    Add-ServiceCard $slide 270 156 "KV" "Azure Key Vault" "Protects connection strings, credentials, and application secrets outside the codebase." $purple
    Add-ServiceCard $slide 492 156 "BS" "Azure Blob Storage" "Stores product images, uploads, invoices, exports, and other object data." $green
    Add-ServiceCard $slide 714 156 "DB" "Cosmos DB" "Provides a MongoDB-compatible database for products, carts, orders, and profiles." $orange
    Add-SlideNumber $slide 2 $muted

    # Slide 3: Infrastructure as code and identity
    $slide = $presentation.Slides.Add(3, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $white
    $slide.Background.Fill.Solid()
    Add-TopBar $slide "Implementation"
    Add-TextBox $slide 48 55 760 44 "Infrastructure as Code & Identity" 30 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 48 102 800 26 "Repeatable Azure provisioning with centralized application access management." 13 $slate "Aptos" $false $ppAlignLeft $ppAnchorMiddle | Out-Null

    $terraformCard = Add-Rectangle $slide 48 156 418 302 $offWhite $line 8
    $terraformCard.Shadow.Visible = $msoTrue
    $terraformCard.Shadow.ForeColor.RGB = Rgb 15 23 42
    $terraformCard.Shadow.Transparency = 0.9
    $terraformCard.Shadow.OffsetY = 3
    Add-Rectangle $slide 48 156 8 302 $purple | Out-Null
    Add-Circle $slide 82 184 58 $purple | Out-Null
    Add-TextBox $slide 82 184 58 58 "TF" 17 $white "Aptos Display" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 158 181 270 30 "Terraform Provisioning" 21 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 158 216 250 18 "INFRASTRUCTURE AS CODE" 9 $purple "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null

    Add-Circle $slide 82 276 24 $purple | Out-Null
    Add-TextBox $slide 82 276 24 24 "1" 9 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 120 272 300 24 "Reusable Terraform modules" 14 $navy "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 120 300 292 32 "Resources are organized into reusable, maintainable building blocks." 10 $slate "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null

    Add-Circle $slide 82 354 24 $purple | Out-Null
    Add-TextBox $slide 82 354 24 24 "2" 9 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 120 350 300 24 "Terraform workspaces" 14 $navy "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 120 378 292 42 "Separate environments and state while using the same infrastructure code." 10 $slate "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null

    $identityCard = Add-Rectangle $slide 494 156 418 302 $offWhite $line 8
    $identityCard.Shadow.Visible = $msoTrue
    $identityCard.Shadow.ForeColor.RGB = Rgb 15 23 42
    $identityCard.Shadow.Transparency = 0.9
    $identityCard.Shadow.OffsetY = 3
    Add-Rectangle $slide 494 156 8 302 $azure | Out-Null
    Add-Circle $slide 528 184 58 $azure | Out-Null
    Add-TextBox $slide 528 184 58 58 "ID" 17 $white "Aptos Display" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 604 181 270 30 "Microsoft Entra ID" 21 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 604 216 250 18 "IDENTITY & ACCESS MANAGEMENT" 9 $azure "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null

    Add-Circle $slide 528 276 24 $azure | Out-Null
    Add-TextBox $slide 528 276 24 24 "1" 9 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 566 272 300 24 "Application authentication" 14 $navy "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 566 300 292 32 "Users sign in through Microsoft Entra ID and App Service Authentication." 10 $slate "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null

    Add-Circle $slide 528 354 24 $azure | Out-Null
    Add-TextBox $slide 528 354 24 24 "2" 9 $white "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 566 350 300 24 "Centralized IAM" 14 $navy "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 566 378 292 42 "Identity and access policies are managed centrally without storing user passwords." 10 $slate "Aptos" $false $ppAlignLeft $ppAnchorTop | Out-Null
    Add-SlideNumber $slide 3 $muted

    # Slide 4: Image placeholders
    $slide = $presentation.Slides.Add(4, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $white
    $slide.Background.Fill.Solid()
    Add-TopBar $slide "Demo"
    Add-TextBox $slide 48 55 680 44 "Project Screenshots" 30 $navy "Aptos Display" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 48 102 760 26 "Replace these frames with screenshots from the running application and Azure portal." 13 $slate "Aptos" $false $ppAlignLeft $ppAnchorMiddle | Out-Null

    Add-ImagePlaceholder $slide 48 156 272 286 "1" "Home & Products" "Add the KubeCart landing page or product catalog screenshot."
    Add-ImagePlaceholder $slide 344 156 272 286 "2" "Cart & Checkout" "Add the shopping cart, order flow, or profile screen."
    Add-ImagePlaceholder $slide 640 156 272 286 "3" "Azure Resources" "Add the App Service overview or deployed resource group."

    Add-TextBox $slide 48 470 650 20 "TIP  |  Use 16:9 screenshots for the cleanest fit." 9 $azure "Aptos" $true $ppAlignLeft $ppAnchorMiddle | Out-Null
    Add-SlideNumber $slide 4 $muted

    # Slide 5: Thank you
    $slide = $presentation.Slides.Add(5, $ppLayoutBlank)
    $slide.FollowMasterBackground = $msoFalse
    $slide.Background.Fill.ForeColor.RGB = $navy
    $slide.Background.Fill.Solid()

    Add-Circle $slide -120 280 330 $azure | Out-Null
    Add-Circle $slide -55 340 205 $navy2 | Out-Null
    Add-Circle $slide 790 -110 280 $cyan | Out-Null
    Add-Circle $slide 840 -55 180 $azure | Out-Null

    Add-TextBox $slide 130 162 700 72 "Thank You" 48 $white "Aptos Display" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-Rectangle $slide 424 250 112 4 $azure | Out-Null
    Add-TextBox $slide 180 286 600 38 "Questions & Discussion" 20 $offWhite "Aptos Display" $false $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-TextBox $slide 180 345 600 26 "KubeCart on Microsoft Azure" 12 $muted "Aptos" $true $ppAlignCenter $ppAnchorMiddle | Out-Null
    Add-SlideNumber $slide 5 $muted

    if (Test-Path $outputPath) {
        Remove-Item -LiteralPath $outputPath -Force
    }
    $presentation.SaveAs($outputPath, $ppSaveAsOpenXmlPresentation)
    $presentation.Close()
    $presentation = $null
    $powerPoint.Quit()
    $powerPoint = $null

    Write-Output "Created: $outputPath"
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
