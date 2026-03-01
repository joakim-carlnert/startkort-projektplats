

# Startkort MVP1 — Implementation Plan

## Overview
A calm, mobile-first digital project page for construction sites. No auth, no dashboards — just a shared document feel. All UI text in Swedish.

## Backend (Supabase)
- Create **projects** table (id, title, company, address, directions, practical_info, contacts jsonb, created_at)
- Create **posts** table (id, project_id FK, image_url, text, role, is_done, created_at)
- Create **questions** table (id, project_id FK, text, created_at)
- Create a **public storage bucket** for post images
- Open RLS policies (no auth required — all public read/write)

## Pages

### 1. Admin Page — `/admin`
- Simple form: Projektnamn, Företag, Adress, Vägbeskrivning, Praktisk information
- Dynamic contacts list (Roll, Namn, Telefon) with add/remove
- "Spara projekt" button → saves to Supabase, shows generated `/project/{id}` link
- List of existing projects with edit capability

### 2. Project Page — `/project/:id`
The Startkort itself. Clean vertical layout, white background, thin grey dividers between sections:

- **Header**: "STARTKORT" centered, then project name, company, address
- **Hitta hit**: Clickable Google Maps address link + directions text
- **Praktiskt**: Practical info text block
- **Kontakt**: List of role – name – phone
- **📷 Lägg upp uppdatering** button → opens posting flow
- **Uppdateringar**: Posts newest-first (image, role, optional text, ✓ Klar badge, Swedish timestamp)
- **Frågor**: Questions list with timestamps + input to submit new question

### 3. Posting Flow (modal/sheet)
- Camera/file input (mobile-first)
- Image preview
- Optional text field
- Role dropdown (Snickare, Elektriker, VVS, Målare, Plattsättare, Golvläggare, UE, Arbetsledning, Annat…)
- "Annat" reveals free text input
- "Markera som klart" checkbox
- "Publicera" button → uploads image to storage, saves post, returns to page

## Design
- White background, black/dark grey text only
- No gradients, shadows, or animations
- Thin `border-b border-gray-200` dividers
- Minimal typography, clean vertical stacking
- Mobile-first, responsive

## Swedish Timestamps
- Utility function: "Idag 14:32", "Igår 09:15", "4 mars 14:32"

